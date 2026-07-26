# Tasks: Human-Agent Workplace

Status: in progress

Every subagent prompt carries these two rules: do not run any git command, and end the report with the exact list of files created or modified.

## Wave 1 — Teardown and foundations

- [ ] T1: Replace the database schema and migrate
  - Satisfies: AC-1, AC-4, AC-7, AC-8, AC-14, AC-15, AC-20, AC-21, AC-23, AC-25
  - Files: `src/lib/server/db/schema.ts`, `drizzle/` (generated migration + meta)
  - Do: Rewrite `schema.ts` with `project`, `chatSession`, `chatMessage`, `document`, `documentChunk` exactly as specified in plan.md's Data Model section, including the `tsvector` custom type with `.generatedAlwaysAs(sql\`to_tsvector('english', content)\`)`, `vector('embedding', { dimensions: 1536 })`, the HNSW index using `vector_cosine_ops`, the GIN index on `tsv`, and the btree indexes listed. Drop `paper`, `reference` and `job` and their relations; keep the `auth.schema` re-export. Define Drizzle relations for the new tables. Then run `pnpm auth:schema`, `pnpm db:generate`, `pnpm db:migrate`. The `vector` extension is already installed on the database.
  - Done when: `drizzle-kit migrate` completes and a `psql`-equivalent query confirms all five new tables plus the four auth tables exist, the embedding column reports `vector(1536)`, and both the HNSW and GIN indexes are present.

- [ ] T2: Pure helper modules with unit tests
  - Satisfies: AC-10, AC-11, AC-19, AC-23, AC-32
  - Files: `src/lib/server/rrf.ts`, `src/lib/server/rrf.spec.ts`, `src/lib/server/limits.ts`, `src/lib/server/limits.spec.ts`, `src/lib/utils/session-label.ts`, `src/lib/utils/session-label.spec.ts`
  - Do: `fuseRrf(lists: string[][], opts?: { k?: number; limit?: number })` scoring each id as the sum of `1 / (k + rank)` over the lists containing it, with one-based ranks, `k = 60` and `limit = 5` as defaults, returning ids sorted by descending score. `limits.ts` exports `MAX_CHARS = 45_000` and `checkCharLimit(count)` returning `{ ok: true }` or `{ ok: false, message }` where the message names both the actual count and the limit. `session-label.ts` exports `sessionLabel(name: string | null, firstUserMessage?: string)` returning the name when set, else the first message truncated to 60 characters with an ellipsis, else `New chat`, and `validateName(raw)` trimming and enforcing 1 to 100 characters. Cover the 45,000 and 45,001 boundary, ids appearing in one list versus both, empty input, and each `sessionLabel` branch.
  - Done when: `pnpm test:unit --run` passes with these specs included and no other spec broken.

- [ ] T3: Extraction module and dependency swap
  - Satisfies: AC-16, AC-17, AC-20, AC-32
  - Files: `src/lib/server/extract.ts`, `src/lib/server/extract.spec.ts`, `package.json`
  - Do: Add `markitdown-ts` and remove `pdf-parse` from dependencies, then install. Export `extractDocument(buffer: Buffer, filename: string): Promise<{ kind: 'pdf' | 'markdown' | 'text'; text: string }>`. Accept only `.pdf`, `.md`, `.markdown`, `.txt`; anything else throws `UnsupportedTypeError` whose message names the accepted extensions. Call `new MarkItDown().convertBuffer(buffer, { file_extension: ext })` for all types and use the `markdown` field of the result. Throw `EmptyExtractionError` when the result is null or the text is blank after trimming, which is the scanned-PDF and corrupt-file case. Do not count pages. Export the error classes. Test dispatch and rejection using small in-memory `.md` and `.txt` buffers and a byte-string that is not a valid PDF; do not require a real PDF fixture.
  - Done when: `pnpm test:unit --run` passes, and `grep -r "pdf-parse" src/` returns nothing.

- [ ] T4: Open up authentication
  - Satisfies: AC-34, AC-35
  - Files: `src/lib/server/auth.ts`
  - Do: Set `requireEmailVerification: false`. Delete the `emailVerification` block and the `sendVerificationEmail` function. Delete `MAX_USERS`, the `beforeSignUp` hook, and the `count` and `userTable` imports left unused by that deletion. Leave `sendResetPassword`, `onPasswordReset` and `requireSession` untouched.
  - Done when: `pnpm check` reports no new errors in `auth.ts`, and `grep -rn "MAX_USERS\|USER_LIMIT_REACHED\|beforeSignUp\|requireEmailVerification: true" src/` returns nothing.

- [ ] T5: Point the model clients at OpenRouter
  - Satisfies: AC-30, AC-31
  - Files: `src/lib/server/llm.ts`, `.env.example`
  - Do: Reduce `llm.ts` to model clients only. `getLlm()` returns `ChatOpenAI` with `model: env.REASONING_MODEL` and `configuration: { baseURL: 'https://openrouter.ai/api/v1', apiKey: env.OPENROUTER_API_KEY }`. `getEmbeddings()` returns `OpenAIEmbeddings` with `model: env.EMBEDDING_MODEL` and the same configuration. `checkLlmHealth()` and `checkEmbeddingHealth()` both GET `https://openrouter.ai/api/v1/models` with the bearer token and a 5-second timeout. Delete `SummarySchema`, `SummaryResult`, `getVectorStore`, `createRagAgent`, `buildSystemPrompt`, the `PROMPT_PATH` read and the `pgConfig` / `vectorStoreConfig` objects. In `.env.example` remove any stale `CHAT_MODEL_URL`, `EMBEDDING_URL`, `CHAT_MODEL_API_KEY` and `EMBEDDING_URL_KEY` entries and document `REASONING_MODEL=google/gemma-4-31b-it` and `EMBEDDING_MODEL=openai/text-embedding-3-small` as the verified working values.
  - Done when: `llm.ts` exports exactly `getLlm`, `getEmbeddings`, `checkLlmHealth`, `checkEmbeddingHealth`, and a one-off node script confirms `getEmbeddings().embedQuery('test')` returns a 1536-length array.

- [ ] T6: Delete the paper feature
  - Satisfies: AC-16 (removal half), and clears the way for every UI criterion
  - Files: delete `src/routes/api/upload/`, `src/routes/api/papers/`, `src/routes/api/jobs/`, `src/routes/api/chat/+server.ts`, `src/routes/+page.server.ts`, `src/lib/server/upload-jobs.ts`, `default-prompts/summarize.txt`, `src/lib/components/dedicated/app/SummaryView.svelte`, `ContentPanel.svelte`, `FilePanel.svelte`, `FileListItem.svelte`; modify `src/lib/utils/types.ts`, `src/routes/+page.svelte`
  - Do: Remove the files listed. In `types.ts` delete `SummaryData`, `PapersyFile` and `Mode`, keep the `JobStatus` enum untouched because the schema and ingestion reuse it, and add `Project`, `Session`, `Document` and a `ChatMessage` whose role is `'user' | 'assistant'`. Reduce `+page.svelte` to the login gate plus a placeholder heading for the signed-in state, keeping `LoginCard`, `handleLogin` and `handleSignUp` working and dropping `invalidateAll` and the `data` prop now that the server load is gone. Keep the `.app-shell` styles in place for the next wave to move.
  - Done when: `pnpm build` succeeds, and `grep -rn "PapersyFile\|SummaryData\|summaryData\|paperId" src/` returns nothing.

## Wave 2 — Server capability

- [ ] T7: Hybrid retrieval
  - Satisfies: AC-23, AC-24, AC-25
  - Files: `src/lib/server/retrieval.ts`
  - Do: Export `hybridSearch(projectId, userId, query)` returning up to 5 `{ id, content, source }` where `source` is the owning document's name. Internally run the two SQL statements in plan.md's Hybrid Retrieval Detail section, each limited to 20 and each filtered by both `project_id` and `user_id`, using `db.execute(sql\`…\`)` with bound parameters. Embed the query with `getEmbeddings().embedQuery`. Fuse the two id lists with `fuseRrf` from `rrf.ts`. Hydrate the winning ids in one query joined to `document` for the name, and return them in fused order, not database order. Return an empty array when both arms are empty. Export the per-arm candidate depth as a named constant.
  - Done when: a scratch node script inserts two chunks in one project and one in another, then confirms a query returns only the first project's chunks, that a rare literal present in exactly one chunk retrieves it, and that a nonsense query returns an empty array.

- [ ] T8: Document ingestion
  - Satisfies: AC-15, AC-19, AC-20, AC-21, AC-22
  - Files: `src/lib/server/ingest.ts`, `src/lib/server/ingest-jobs.ts`
  - Do: `ingest-jobs.ts` exports `activeIngestions: Map<string, AbortController>`, mirroring the deleted `upload-jobs.ts`. `ingest.ts` exports `ingestDocument(documentId, projectId, userId, buffer, filename, signal)`, which advances `document.status` through `processing` then `storing` then `done`, checking the abort signal between steps and setting `cancelled` when aborted. It splits with `RecursiveCharacterTextSplitter` at chunk size 1000 and overlap 200, calls `checkEmbeddingHealth()` before embedding and fails the document with a stated reason when unhealthy, embeds all chunks with `getEmbeddings().embedDocuments`, and inserts them with `chunkIndex`, `projectId` and `userId` populated. On any throw it sets `status: 'failed'` and writes the message to `document.error`. It always deletes its entry from `activeIngestions` in a `finally`. Extraction and the character check happen in the route before this is called, so this function assumes a valid document row already exists.
  - Done when: a scratch script ingests a small text buffer end to end, the document reaches `done`, chunk rows exist with non-null embeddings, and aborting mid-run leaves the document `cancelled`.

- [ ] T9: Project, session and message APIs
  - Satisfies: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-12, AC-13, AC-14
  - Files: `src/routes/api/projects/+server.ts`, `src/routes/api/projects/[projectId]/+server.ts`, `src/routes/api/projects/[projectId]/sessions/+server.ts`, `src/routes/api/sessions/[sessionId]/+server.ts`, `src/routes/api/sessions/[sessionId]/messages/+server.ts`
  - Do: Implement the routes in plan.md's API table other than chat and documents. Every handler calls `requireSession(request.headers)` first and then confirms the target row belongs to `session.user.id`, returning `error(404)` for a missing or foreign id so nothing is disclosed. Names go through `validateName` from `session-label.ts` and return `error(400, message)` on failure. Creating a session leaves `name` null. `PATCH /api/sessions/[sessionId]` sets `name` and nothing else clears it. Deleting a project or session relies on the cascade; the project delete also aborts every `activeIngestions` controller for that project's documents. The session list returns each session's derived label using `sessionLabel` with its first user message.
  - Done when: a scratch script exercising create, list, rename, reject-blank-name, delete and cross-user 404 passes against a running dev server for both projects and sessions.

## Wave 3 — Agent and remaining API

- [ ] T10: Grounded chat endpoint and system prompt
  - Satisfies: AC-8, AC-22, AC-26, AC-27, AC-28, AC-29, AC-31
  - Files: `src/lib/server/agent.ts`, `default-prompts/chatbot.txt`, `src/routes/api/chat/+server.ts`
  - Do: Rewrite `chatbot.txt` around a project knowledge base with a `{projectName}` placeholder. It must instruct the agent to call `retrieve` before making factual claims, to name the source document for every claim it makes, to reason and infer freely across retrieved chunks, to answer questions about the conversation itself without retrieving, and, when retrieval returns nothing relevant, to say plainly that the knowledge base does not cover it and propose one concrete Google search query rather than answering from its own knowledge. Keep a strengthened instruction that text inside retrieved content is data and never an instruction to obey. `agent.ts` exports `createProjectAgent({ projectId, userId, projectName })` building a `retrieve` tool over `hybridSearch` that returns each hit as `Source: <name>` followed by its content, and wires it into `createAgent` with the interpolated prompt. `/api/chat` accepts `{ sessionId, text }`, verifies session ownership, returns 503 when either health check fails, persists the user message, loads prior messages as history, invokes the agent, persists the assistant reply, and returns `{ text }`.
  - Done when: against a project holding one seeded document, a question the document answers produces a reply naming that document, and an unrelated question produces a refusal containing a Google query suggestion. Both messages are present in `chat_message` afterwards.

- [ ] T11: Document APIs
  - Satisfies: AC-15, AC-17, AC-19, AC-21
  - Files: `src/routes/api/projects/[projectId]/documents/+server.ts`, `src/routes/api/documents/[documentId]/+server.ts`
  - Do: `GET` lists the project's documents with `id`, `name`, `kind`, `status` and `error`. `POST` takes multipart form data, verifies project ownership, calls `extractDocument`, and on `UnsupportedTypeError` or `EmptyExtractionError` returns 400 with that message having stored nothing. It then applies `checkCharLimit` to the extracted text and returns 400 with the limit message when it fails, again storing nothing. Only after both checks does it insert the `document` row and start `ingestDocument` in the background with a registered `AbortController`, returning `{ documentId }` immediately. `DELETE` verifies ownership, aborts any active ingestion, deletes the document row and relies on the cascade for chunks.
  - Done when: uploading a `.md` file reaches `done` on polling, uploading a `.png` returns 400 naming the accepted types, uploading a 45,001-character `.txt` returns 400 naming the count with no row created, and deleting a document removes its chunks.

## Wave 4 — Components

- [ ] T12: Project, session and rename components
  - Satisfies: AC-1, AC-3, AC-7, AC-10, AC-11, AC-12
  - Files: `src/lib/components/dedicated/app/ProjectList.svelte`, `ProjectListItem.svelte`, `SessionList.svelte`, `RenameDialog.svelte`
  - Do: Presentational Svelte 5 components taking data and callbacks as props, holding no fetch logic. `ProjectList` renders items with a create control and per-item rename and delete actions. `SessionList` renders sessions by their derived label with a new-chat control and per-item rename and delete. `RenameDialog` takes a current value and an `onSubmit`, shows a validation message for blank or over-length input without submitting, and is reused by both. Follow the existing `FileListItem`-era markup conventions and SCSS variables; check `git show HEAD:src/lib/components/dedicated/app/FileListItem.svelte` for the prior styling idiom.
  - Done when: `pnpm check` passes and each component renders in isolation with sample props.

- [ ] T13: Knowledge base components
  - Satisfies: AC-15, AC-17, AC-18, AC-19, AC-21, AC-22
  - Files: `src/lib/components/dedicated/app/DocumentList.svelte`, `DocumentListItem.svelte`
  - Do: `DocumentList` takes a `projectId`, fetches `GET /api/projects/[projectId]/documents`, renders a file input accepting `.pdf,.md,.markdown,.txt`, posts uploads, and polls every second while any document is `pending`, `processing` or `storing`, stopping when all are terminal. Surface a rejected upload's 400 message inline. `DocumentListItem` shows name, status and, for a failed document, its error text, plus a delete control.
  - Done when: `pnpm check` passes, and against a running dev server an upload appears, transitions to `done` without a reload, and a rejected upload shows its reason.

- [ ] T14: Chat components
  - Satisfies: AC-8, AC-9, AC-26, AC-30 (edge case: no double send)
  - Files: `src/lib/components/dedicated/app/ChatView.svelte`, `ChatMessage.svelte`, `ChatInput.svelte`
  - Do: Rewire to the session model. `ChatView` takes `messages` and `onSend`, renders assistant markdown through `marked` as today, and keeps the loading-dots indicator. `ChatMessage` handles `role: 'user' | 'assistant'` instead of `'ai'`. `ChatInput` disables submission while a reply is in flight so a second request cannot start in the same session.
  - Done when: `pnpm check` passes and no reference to the old `'ai'` role remains in these files.

## Wave 5 — Pages

- [ ] T15: Project list page
  - Satisfies: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
  - Files: `src/routes/+page.svelte`
  - Do: Replace the placeholder signed-in state with the project list. Fetch `GET /api/projects` on mount, wire create, rename and delete to their endpoints, and navigate to `/p/<id>` on selection with `goto`. Keep the existing login gate untouched. Surface a 400 validation message from the API without navigating.
  - Done when: creating, renaming and deleting a project all work in a browser against the dev server and survive a reload.

- [ ] T16: Project shell and empty state
  - Satisfies: AC-5, AC-7, AC-10, AC-15
  - Files: `src/routes/p/[projectId]/+layout.svelte`, `src/routes/p/[projectId]/+page.svelte`
  - Do: Move the `.app-shell` two-column layout and its portrait-mobile panel toggle out of `+page.svelte`'s styles into the layout. The left panel holds a Chats and Docs tab switching between `SessionList` and `DocumentList`; the right panel is the routed child. The layout fetches the project and its sessions, returning the user to `/` when the API answers 404. `+page.svelte` is the no-session-selected empty state prompting a new chat.
  - Done when: `/p/<id>` renders both tabs with real data, an unknown id redirects to `/`, and the mobile panel toggle still works at portrait widths.

- [ ] T17: Chat session page
  - Satisfies: AC-8, AC-9, AC-13, AC-26, AC-27
  - Files: `src/routes/p/[projectId]/c/[sessionId]/+page.svelte`
  - Do: Load history from `GET /api/sessions/[sessionId]/messages` on mount and whenever the route parameter changes, render through `ChatView`, and post to `/api/chat`. Show the 503 message as an assistant-side error rather than a silent failure. After the first user message in an unnamed session, refresh the session list so the derived label appears.
  - Done when: a full exchange persists across a reload, two sessions in one project keep separate histories, and stopping the model service yields a visible error instead of a hang.

## Wave 6 — Verification and documentation

- [ ] T18: End-to-end suite
  - Satisfies: AC-33, and exercises AC-2, AC-3, AC-12, AC-17, AC-19, AC-26, AC-27, AC-34
  - Files: `e2e/workspace.e2e.ts`, `e2e/fixtures/kb.md`, `e2e/fixtures/oversized.txt`, `playwright.config.ts`
  - Do: One Playwright spec running against the real app, database and OpenRouter models. Sign up a uniquely named user and confirm login succeeds with no verification step. Create a project, rename it, and assert the new name survives a reload. Upload `kb.md`, which contains a distinctive identifier string, and wait for `done`. Ask a question answerable only from that file and assert the reply contains the document name. Ask an unrelated question and assert the reply suggests a Google search. Rename the auto-labelled session and assert the label holds after a further message. Attempt to upload `oversized.txt` at 45,001 characters and assert the rejection names the limit. Assert on shape rather than exact model wording, and raise the per-test timeout to accommodate real model latency.
  - Done when: `pnpm test:e2e` passes twice in a row.

- [ ] T19: Documentation
  - Satisfies: AC-36
  - Files: `agent-docs/config.md`, `agent-docs/architecture.md`, `agent-docs/server.md`, `agent-docs/routes.md`, `agent-docs/types.md`, `agent-docs/components.md`, `agent-docs/lib-overview.md`, `CLAUDE.md`
  - Do: Add an OpenRouter budget section to `config.md` covering `GET /api/v1/key` for this key's `limit`, `limit_remaining` and `usage`, and `GET /api/v1/credits` for the account's `total_credits` and `total_usage`, each with a runnable curl using `Authorization: Bearer $OPENROUTER_API_KEY`, and state explicitly that a key cap and an account balance are different numbers. Update the remaining docs to describe projects, sessions, the shared knowledge base, hybrid retrieval with RRF and the OpenRouter model configuration, removing every reference to papers, summaries, references, the `job` table, PGVectorStore and `pdf-parse`.
  - Done when: `grep -rin "pdf-parse\|PGVectorStore\|summaryData\|keyFindings" agent-docs/ CLAUDE.md` returns nothing, and the config section's two curl commands run successfully.

## Coverage

- AC-1: T1, T9, T12, T15
- AC-2: T2, T9, T15, T18
- AC-3: T9, T12, T15, T18
- AC-4: T1, T9, T15
- AC-5: T9, T15, T16
- AC-6: T9, T15
- AC-7: T1, T9, T12, T16
- AC-8: T1, T9, T10, T14, T17
- AC-9: T9, T14, T17
- AC-10: T2, T9, T12, T16
- AC-11: T2, T9, T12
- AC-12: T2, T9, T12, T18
- AC-13: T9, T17, T18
- AC-14: T1, T9
- AC-15: T1, T8, T11, T13, T16
- AC-16: T3, T6
- AC-17: T3, T11, T13, T18
- AC-18: withdrawn, no task
- AC-19: T2, T8, T11, T13, T18
- AC-20: T1, T3, T8
- AC-21: T1, T8, T11, T13
- AC-22: T8, T10, T13
- AC-23: T1, T2, T7
- AC-24: T7
- AC-25: T1, T7
- AC-26: T10, T14, T17, T18
- AC-27: T10, T17, T18
- AC-28: T10
- AC-29: T10
- AC-30: T5, T14
- AC-31: T5, T10
- AC-32: T2, T3
- AC-33: T18
- AC-34: T4, T18
- AC-35: T4
- AC-36: T19
