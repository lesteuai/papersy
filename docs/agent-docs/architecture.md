# High-Level Architecture

Papersy is a project-based agent workspace. A user owns projects; each project holds many chat sessions and one shared knowledge base of uploaded documents. Every session in a project retrieves from that same knowledge base, so grounding persists across conversations while the conversations stay separate. Built with SvelteKit's adapter-node in SPA mode (`ssr = false`) — pages render client-side, authentication is handled via better-auth with PostgreSQL session storage, and a REST API exposes project, session, document and chat management.

## Key Directories

- **`src/routes/`** — File-based routing
  - `+layout.ts`, `+layout.svelte` — app shell with SPA mode enabled
  - `+page.svelte` — project list, or `LoginCard` when logged out (no `+page.server.ts` anywhere in the app; every page fetches its own data client-side)
  - `+layout.server.ts` — the app's only server load: resolves the better-auth session and returns `{ loggedIn }`, which `+layout.svelte` writes into the `loggedIn` store during init
  - `p/[projectId]/+layout.svelte` — project shell: session list, document list, the two-column/mobile-toggle layout
  - `p/[projectId]/+page.svelte` — empty state prompting a new chat
  - `p/[projectId]/c/[sessionId]/+page.svelte` — the chat itself
  - `api/auth/[...all]/+server.ts` — better-auth handler
  - `api/projects/`, `api/projects/[projectId]/sessions/`, `api/projects/[projectId]/documents/`, `api/sessions/[sessionId]/`, `api/documents/[documentId]/`, `api/chat/` — REST API, detailed in `agent-docs/routes.md`
- **`src/lib/`** — Shared library code
  - `components/` — Atomic Design system, plus `dedicated/app/` for the project workspace UI
  - `icons/` — SVG icon library
  - `scss/` — Global styles, theming
  - `stores/` — Svelte stores (auth, theme)
  - `utils/` — Shared types and utilities
  - `data/` — Static site data
  - `server/` — Server-only (database, LLM, retrieval, ingestion, auth)
- **`src/hooks.server.ts`** — SvelteKit server hook for auth

## Key Concepts

### Authentication

**better-auth** with email/password flows:
- Sessions stored in PostgreSQL
- Client uses `getAuthClient()` from `$lib/auth-client.ts` (lazy browser-only initialization via `$app/environment`)
- Server checks session via `auth.api.getSession({ headers })` in API routes
- Email verification is off (`requireEmailVerification: false`); a newly signed-up user can log in immediately
- The former 100-user sign-up cap is gone; sign-up succeeds regardless of how many users already exist

### Database

**PostgreSQL** with **Drizzle ORM**, entirely Drizzle-owned (no separate vector-store-managed table):
- Auth tables: `user`, `session`, `account`, `verification` (auto-generated)
- `project` → `chatSession` → `chatMessage`: a user's projects, each project's chat sessions, each session's messages
- `document` → `documentChunk`: a project's shared knowledge base and its indexed chunks
- `documentChunk` carries both a `vector(1536)` embedding (HNSW index, `vector_cosine_ops`) and a generated `tsvector` column (`to_tsvector('english', content)`, GIN index), so one table serves both arms of hybrid search
- `chatSession.name` is nullable; `NULL` means "not named by the user," and the display label is derived from the first user message at read time. Only an explicit rename ever writes the column.
- Document ingestion status lives on `document.status`, reusing the `JobStatus` enum values (`pending`, `processing`, `storing`, `done`, `failed`, `cancelled`). There is no separate `job` table.

### Retrieval

Hybrid search, implemented in `src/lib/server/retrieval.ts` and `src/lib/server/rrf.ts`:
- A pgvector cosine-distance arm and a Postgres full-text (`ts_rank_cd` over the `tsv` column) arm, each scoped to `project_id AND user_id` and returning 20 candidates
- The two ranked id lists are fused with Reciprocal Rank Fusion (`k = 60`) down to the 5 best chunks
- The full-text arm exists specifically so a rare literal term (an identifier, product code or unusual name) that cosine similarity ranks poorly still surfaces

### LLM & Agent

`src/lib/server/llm.ts` and `src/lib/server/agent.ts`:
- `ChatOpenAI` (`REASONING_MODEL`) and `OpenAIEmbeddings` (`EMBEDDING_MODEL`), both pointed at `https://openrouter.ai/api/v1` and authenticated with `OPENROUTER_API_KEY`
- `createProjectAgent({ projectId, userId, projectName })` builds a LangChain `createAgent` with a single `retrieve` tool over `hybridSearch`
- The system prompt (`default-prompts/chatbot.txt`) enforces citing the source document on factual claims, reasoning across retrieved chunks, answering conversation-meta questions without retrieval, refusing with a concrete Google query when retrieval is empty, and treating retrieved text as data rather than instructions
- No streaming: `agent.invoke()` returns the complete answer

### Document Ingestion

Background ingestion with cancellation support (`src/lib/server/ingest.ts`, `src/lib/server/ingest-jobs.ts`):
- `.pdf`, `.md`, `.markdown` and `.txt` are all extracted through one `markitdown-ts` call (`MarkItDown.convertBuffer`); any other extension is rejected before a document row is created
- There is no page-count limit; the only size limit is `MAX_CHARS` extracted characters, read from the env with a 500,000 default (`src/lib/server/limits.ts`). A long but sparse PDF is accepted as long as its extracted text fits.
- `activeIngestions` (`ingest-jobs.ts`) holds a module-level `Map<documentId, AbortController>`; deleting a document or its project aborts any in-flight ingestion
- Status progresses `pending` → `processing` → `storing` → `done`, or `failed` with a stored reason, or `cancelled`
- Embedding health is checked before the storing step; if the embedding service is unreachable, ingestion fails with a stated reason

### Data Loading

Every page fetches its own data client-side (no `+page.server.ts` anywhere; the root `+layout.server.ts` supplies only `{ loggedIn }`):
- `/` fetches `GET /api/projects` on mount
- The project layout fetches sessions and documents for the active project
- The chat page fetches message history for the active session and re-fetches whenever the session route param changes

### Styling & Theming

CSS-driven via `data-theme` attribute on `<html>`.
