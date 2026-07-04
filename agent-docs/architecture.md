# High-Level Architecture

Papersy is a full-stack application for research paper summarization and retrieval-augmented generation (RAG) chat. Built with SvelteKit's adapter-node in SPA mode (`ssr = false`) — pages render client-side, authentication is handled via better-auth with PostgreSQL session storage, and a REST API exposes document management and chat functionality.

## Key Directories

- **`src/routes/`** — File-based routing
  - `+layout.ts`, `+layout.svelte` — app shell with SPA mode enabled
  - `+page.server.ts`, `+page.svelte` — authenticated home page
  - `api/auth/[...all]/+server.ts` — better-auth handler
  - `api/upload/+server.ts` — PDF upload, summarize, vectorize
  - `api/chat/+server.ts` — RAG-based chat
  - `api/papers/[id]/+server.ts` — paper GET (details) and DELETE
- **`src/lib/`** — Shared library code
  - `components/` — Atomic Design system (~40 components)
  - `icons/` — SVG icon library
  - `scss/` — Global styles, theming
  - `stores/` — Svelte stores (auth, theme)
  - `utils/` — Shared types and utilities
  - `data/` — Static site data
  - `server/` — Server-only (database, LLM, auth)
- **`src/hooks.server.ts`** — SvelteKit server hook for auth

## Key Concepts

### Authentication

**better-auth** with email/password flows:
- Sessions stored in PostgreSQL
- Client uses `getAuthClient()` from `$lib/auth-client.ts` (lazy browser-only initialization via `$app/environment`)
- Server checks session via `auth.api.getSession({ headers })` in API routes

### Database

**PostgreSQL** with **Drizzle ORM**:
- Auth tables: `user`, `session`, `account`, `verification` (auto-generated)
- Content tables: `paper`, `reference`
- Vector table: `documents` (pgvector, managed by PGVectorStore)
- Job tracking: `job` table with statuses pending/processing/storing/done/failed/cancelled

### LLM & RAG

**LangChain** orchestration:
- `ChatOpenAI` with `temperature: 0.7` for conversational chat responses
- `OpenAIEmbeddings` for vector generation
- `PGVectorStore` (`tableName: "documents"`) for similarity search
- RAG agent receives full conversation history for coherent multi-turn chat
- AI chat responses rendered as markdown HTML via `marked` library

### Upload Processing

**Background job** with cancellation support:
- `src/lib/server/upload-jobs.ts` holds a module-level `Map<jobId, AbortController>`
- `processUpload()` checks `signal.aborted` at each major step (PDF extraction, summarization, vectorization)
- Paper deletion aborts any active upload job for that paper
- PDF text is cleaned of page markers (`-- N of M --`) before being sent to the LLM
- LLM extracts paper name from the first page; if found, it overwrites the filename stored at upload time
- Job progresses through statuses: `pending` → `processing` → `storing` → `done`; `storing` covers the vectorization step
- `parser.destroy()` and `vectorStore.end()` are called in `finally` blocks to ensure cleanup even on error
- On job failure, error message is stored in `job.error` and preserved in `PapersyFile.uploadError` so the UI can display the reason

### Data Loading

Lazy and incremental:
- Initial page load fetches only basic paper info (`id`, `name`, `jobStatus`) — no summary fields
- Full `summaryData` fetched on-demand via `GET /api/papers/[id]` when user clicks a paper
- Upload no longer auto-selects the new paper; current selection is preserved
- Failed papers display error reason in Summary tab; Chat tab is locked until paper is deleted and re-uploaded

### Styling & Theming

CSS-driven via `data-theme` attribute on `<html>`.
