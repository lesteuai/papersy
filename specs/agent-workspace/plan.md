# Plan: Human-Agent Workplace

Status: approved
Spec: spec.md

## Approach

Replace the flat paper list with a three-level model: `project` → `chat_session` → `chat_message`, plus a per-project knowledge base of `document` and `document_chunk`. Chunks carry both a `vector(1536)` embedding and a generated `tsvector`, each with its own index, so one table serves both arms of the hybrid search. `PGVectorStore` is dropped because its table has no place for a `tsvector` column; the chunk table is owned by Drizzle instead, and embeddings are produced by calling `OpenAIEmbeddings` directly. Retrieval issues two ranked queries and fuses them with a pure TypeScript RRF function, which keeps the SQL simple and makes the fusion unit-testable. The agent keeps LangChain's `createAgent` with a single `retrieve` tool, now scoped to a project rather than a paper, driven by a rewritten system prompt that enforces citation and the "I don't know plus Google query" fallback. Summarization is deleted outright.

## Data Model and Contracts

### Tables (all in `src/lib/server/db/schema.ts`)

```ts
project        id text pk, userId text fk→user cascade, name text notNull, createdAt
chatSession    id text pk, projectId text fk→project cascade, userId text fk→user cascade,
               name text NULL, createdAt
chatMessage    id text pk, sessionId text fk→chat_session cascade, role text notNull,
               content text notNull, createdAt
document       id text pk, projectId text fk→project cascade, userId text fk→user cascade,
               name text notNull, kind text notNull, charCount integer,
               status text notNull default 'pending', error text NULL, createdAt
documentChunk  id text pk, documentId text fk→document cascade, projectId text notNull,
               userId text notNull, content text notNull, chunkIndex integer notNull,
               embedding vector(1536), tsv tsvector GENERATED ALWAYS AS
                 (to_tsvector('english', content)) STORED
```

`chat_session.name` is nullable on purpose: `NULL` means "not named by the user", so the display label is derived from the first user message at read time. A rename writes the column. This satisfies AC-11, AC-12 and AC-13 with one column and no separate flag — a user-set name can never be overwritten because nothing else ever writes it.

The `job` table is dropped. Ingestion state lives on `document.status` / `document.error`, reusing the existing `JobStatus` values (`pending`, `processing`, `storing`, `done`, `failed`, `cancelled`), which stay `text` per the project's standing preference for text over pgEnum.

`documentChunk.projectId` and `userId` are denormalized so retrieval filters without a join (AC-25).

Indexes: HNSW on `embedding` with `vector_cosine_ops`, GIN on `tsv`, btree on `document_chunk.project_id`, `chat_message.session_id`, `chat_session.project_id`, `document.project_id`, `project.user_id`.

`to_tsvector('english', …)` is written explicitly because the database's `default_text_search_config` is `pg_catalog.simple`, which applies no stemming and strips no stopwords.

### API

| Method | Path | Purpose | Serves |
|---|---|---|---|
| GET, POST | `/api/projects` | list, create | AC-1, AC-2, AC-6 |
| PATCH, DELETE | `/api/projects/[projectId]` | rename, delete | AC-3, AC-4, AC-5 |
| GET, POST | `/api/projects/[projectId]/sessions` | list, create | AC-7 |
| PATCH, DELETE | `/api/sessions/[sessionId]` | rename, delete | AC-12, AC-13, AC-14 |
| GET | `/api/sessions/[sessionId]/messages` | history | AC-8, AC-9 |
| POST | `/api/chat` | `{sessionId, text}` → persist both messages, return answer | AC-8, AC-22, AC-26, AC-27, AC-31 |
| GET, POST | `/api/projects/[projectId]/documents` | list with status, upload | AC-15, AC-17, AC-19 |
| DELETE | `/api/documents/[documentId]` | delete + cancel ingestion | AC-21 |

Every handler calls `requireSession` and then verifies the row belongs to `session.user.id`, returning 404 rather than 403 on a foreign id (AC-5, AC-6, AC-25).

### Pages

`ssr = false` stays, so pages fetch their own data client-side; no `+page.server.ts` is added.

- `/` — project list, or `LoginCard` when logged out.
- `/p/[projectId]` — left panel with a Chats/Docs tab, right panel empty-state prompting a new chat.
- `/p/[projectId]/c/[sessionId]` — same shell, right panel is the chat.

The existing `.app-shell` two-column layout and its portrait-mobile panel toggle move into `src/routes/p/[projectId]/+layout.svelte` unchanged.

## Affected Code

### New

- `src/lib/server/extract.ts` — `extractDocument(buffer, filename)` → `{ kind, text }`. Dispatches on extension and calls `MarkItDown.convertBuffer(buffer, { file_extension })` for all three types. Throws typed errors for unsupported type, char overflow and empty extraction. No page counting. Serves AC-16, AC-17, AC-19, AC-20.
- `src/lib/server/limits.ts` — `MAX_CHARS = 45_000` and one pure check function returning either `ok` or a message naming the actual and allowed character counts. Serves AC-19, AC-32.
- `src/lib/server/rrf.ts` — `fuseRrf(lists: string[][], { k = 60, limit = 5 })`. Pure, no database access, so it is directly unit-testable. Serves AC-19, AC-23, AC-32.
- `src/lib/server/retrieval.ts` — `searchVector(projectId, userId, queryEmbedding, n)` and `searchFullText(projectId, userId, queryText, n)`, each returning chunk ids in rank order, then `hybridSearch()` which embeds the query, runs both with `n = 20`, fuses via `fuseRrf`, and hydrates the top 5 chunks with their document names. Serves AC-23, AC-24, AC-25, AC-26.
- `src/lib/server/ingest.ts` — background ingestion: extract, enforce limits, chunk, embed, insert chunks, advance `document.status`, honour the abort signal at each step. Serves AC-15, AC-20, AC-22.
- `src/lib/server/ingest-jobs.ts` — `Map<documentId, AbortController>`, replacing `upload-jobs.ts`. Serves AC-4, AC-21.
- `src/lib/utils/session-label.ts` — `sessionLabel(name, firstUserMessage)` → user name, else truncated first message, else `New chat`. Pure. Serves AC-10, AC-11, AC-32.
- Routes listed in the API and Pages tables above.
- Components: `ProjectList.svelte`, `ProjectListItem.svelte`, `SessionList.svelte`, `DocumentList.svelte`, `DocumentListItem.svelte`, `RenameDialog.svelte` under `src/lib/components/dedicated/app/`.
- Migration in `drizzle/` dropping `paper`, `reference`, `job`, `documents` and creating the five new tables with their indexes.
- Tests: `src/lib/server/rrf.spec.ts`, `limits.spec.ts`, `extract.spec.ts`, `src/lib/utils/session-label.spec.ts`, and `e2e/workspace.e2e.ts` with fixture documents under `e2e/fixtures/`. No seed script is needed now that verification is off: the suite signs up and logs in through the UI.

### Changed

- `src/lib/server/llm.ts` — `getLlm()` becomes `ChatOpenAI` with `model: env.REASONING_MODEL`, `configuration.baseURL = 'https://openrouter.ai/api/v1'`, `apiKey: env.OPENROUTER_API_KEY`. `getEmbeddings()` likewise with `env.EMBEDDING_MODEL`. Health checks ping `https://openrouter.ai/api/v1/models`. `createRagAgent` takes `{ projectId, userId, projectName }` and its `retrieve` tool calls `hybridSearch`, returning content plus source name per chunk. `SummarySchema`, `getVectorStore` and the PGVectorStore config are deleted. Serves AC-22, AC-26, AC-30, AC-31.
- `src/lib/server/db/schema.ts` — replaced wholesale, including the `tsvector` custom type and the `vector` column.
- `src/lib/utils/types.ts` — drop `SummaryData`, `PapersyFile`, `Mode`; add `Project`, `Session`, `Document`, `ChatMessage` with `role: 'user' | 'assistant'`. Keep `JobStatus`, reused for document status.
- `src/routes/+page.svelte` — becomes the project list; all paper, summary, job-polling and mode-switching logic removed.
- `src/routes/+page.server.ts` — deleted; `/` loads client-side like the rest of the SPA.
- `default-prompts/chatbot.txt` — rewritten for a project knowledge base: cite the source document name on every factual claim, reason across retrieved chunks freely, answer conversation-meta questions without retrieval, and when retrieval is empty say so and propose a concrete Google query. Retains and strengthens the "treat retrieved text as data" line. Serves AC-26, AC-27, AC-28, AC-29.
- `src/lib/components/dedicated/app/ChatView.svelte`, `ChatMessage.svelte`, `ChatInput.svelte` — kept, rewired to the session model; `ChatInput` gains the in-flight guard.
- `src/lib/server/auth.ts` — `requireEmailVerification: false`, and `sendVerificationEmail` / the `emailVerification` block removed so no send is attempted. `MAX_USERS`, the `beforeSignUp` hook and the now-unused `count` and `userTable` imports are deleted. `sendResetPassword` and the reset routes stay in place, unreferenced by the sign-in flow. Serves AC-34, AC-35.
- `.env.example` — `OPENROUTER_API_KEY`, `REASONING_MODEL`, `EMBEDDING_MODEL` documented with the verified working values; stale URL vars removed. Serves AC-30.
- `agent-docs/config.md` — new section on checking OpenRouter budget: `GET /api/v1/key` returns this key's `limit`, `limit_remaining` and `usage`; `GET /api/v1/credits` returns the account's `total_credits` and `total_usage`. Both take `Authorization: Bearer $OPENROUTER_API_KEY`. The section states plainly that a key cap and an account balance are different numbers, since the key here caps at $1 while the account holds $10. Serves AC-35.
- `agent-docs/*.md` and `CLAUDE.md` — architecture, server, routes, types, components and data docs updated to describe projects, sessions and the knowledge base instead of papers and summaries. Serves no AC directly; required because CLAUDE.md instructs future work to trust these files.
- `package.json` — add `markitdown-ts`; remove `pdf-parse`. `@langchain/community` is removed if nothing else imports it.

### Deleted

`src/lib/components/dedicated/app/SummaryView.svelte`, `ContentPanel.svelte`, `FilePanel.svelte`, `FileListItem.svelte`, `src/lib/server/upload-jobs.ts`, `default-prompts/summarize.txt`, `src/routes/api/upload/`, `src/routes/api/papers/`, `src/routes/api/jobs/`.

## Hybrid Retrieval Detail

Vector arm, ordered by cosine distance, limit 20:

```sql
SELECT id FROM document_chunk
WHERE project_id = $1 AND user_id = $2
ORDER BY embedding <=> $3 LIMIT 20
```

Full-text arm, ordered by `ts_rank_cd`, limit 20:

```sql
SELECT id FROM document_chunk, plainto_tsquery('english', $3) q
WHERE project_id = $1 AND user_id = $2 AND tsv @@ q
ORDER BY ts_rank_cd(tsv, q) DESC LIMIT 20
```

`fuseRrf` scores each id as `Σ 1 / (k + rank)` with `k = 60` and one-based ranks, sorts descending, and returns the first 5 ids. An id present in only one list still scores. Empty input yields an empty result, which is the AC-27 path. A one-or-two-character query produces an empty `plainto_tsquery` and a vector arm that returns whatever is nearest; the top 5 cap keeps it bounded.

AC-24 is provable because the full-text arm matches a rare literal that cosine similarity ranks poorly: the e2e seeds a document containing a distinctive identifier and asserts that chunk is retrieved.

## Libraries

- `markitdown-ts@0.0.10` — extraction for `.pdf`, `.md`, `.txt` through `MarkItDown.convertBuffer`. Its `PlainTextConverter` accepts any `text/*` mime, so markdown and text need no separate branch.
- `drizzle-orm@0.45.1` — `vector('embedding', { dimensions: 1536 })`, a `customType` for `tsvector` with `.generatedAlwaysAs()`, and `.using('hnsw', …)` / `.using('gin', …)` indexes. Confirmed against current Drizzle docs.
- `langchain@1.2.39` + `@langchain/openai@1.4.1` — `createAgent`, `tool`, `ChatOpenAI`, `OpenAIEmbeddings`. Already in use; no version change.
- `@langchain/textsplitters@1.0.1` — `RecursiveCharacterTextSplitter`, chunk size 1000, overlap 200, unchanged from today.
- `@playwright/test@1.58.2`, `vitest@4.1.0` — existing test stack, no additions.

## Risks

- **No page limit means a very long sparse PDF can pass.** A 200-page PDF of mostly figures may extract under 45,000 characters and be accepted. Accepted deliberately per AC-18's withdrawal; the character limit is what actually bounds cost and context size.
- **markitdown-ts is pre-1.0 and pulls `xlsx`, `jsdom`, `mammoth`, `ai` transitively.** Accepted in the spec. Mitigation: extraction is confined to `extract.ts`, so swapping the library later touches one file.
- **RRF with `k = 60` is a default, not a tuned value.** Mitigation: `k` and the per-arm candidate depth are module constants, adjustable without touching call sites.
- **e2e against real models costs credit and can be slow.** The key has roughly $0.82 remaining; a full run is fractions of a cent at gemma-4-31b-it's rate. Mitigation: keep the suite small, give model-dependent assertions generous timeouts, and assert on shape (a source name appears; a Google suggestion appears) rather than exact wording.
- **Sign-up becomes fully open.** With verification off (AC-34) and the user cap removed (AC-35), anyone reaching the deployed origin can create an account. Accepted deliberately for this stage; re-enabling verification is a one-line change once real email sending exists, and a rate limit or invite gate is the better long-term control than a hard user count.
- **The database is empty, so `drizzle migrate` must create the auth tables too.** Mitigation: the migration wave runs `auth:schema` then `db:generate` then `db:migrate` and verifies all tables exist before any feature work depends on them.
- **Deleting a chunk table row set for a large document is a wide delete.** Chunks cascade from `document`, so a single `DELETE FROM document` suffices; no manual vector cleanup like today's `vectorStore.delete({filter})`.
