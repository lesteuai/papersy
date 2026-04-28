## Project Configuration

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Package Manager**: npm
- **Build**: `adapter-node` (SPA mode: `ssr = false` in +layout.ts)
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, better-auth, mdsvex, mcp, langchain, pdf-parse, zod, pg, drizzle-orm, pgvector

---

## Environment Variables

Server-side configuration (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `ORIGIN` — Production server origin for CORS and auth redirects
- `ORIGIN_DEV` — Development server origin (used when `NODE_ENV` is not `production`; falls back to `ORIGIN`)
- `BETTER_AUTH_SECRET` — Secret key for better-auth session signing
- `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` — PostgreSQL connection details
- `CHAT_MODEL_URL` — OpenAI-compatible LLM endpoint (e.g., local Ollama at `http://localhost:11434/v1`)
- `EMBEDDING_URL` — OpenAI-compatible embedding endpoint
- `EMBEDDING_URL_KEY` — API key for the embedding endpoint (use `local` for local models)
- `BODY_SIZE_LIMIT` — SvelteKit request body size limit (e.g., `100M` for large PDF uploads)

---

## High-Level Architecture

**Papersy** is a full-stack application for research paper summarization and retrieval-augmented generation (RAG) chat. Built with SvelteKit's adapter-node in SPA mode (`ssr = false`) — pages render client-side, authentication is handled via better-auth with PostgreSQL session storage, and a REST API exposes document management and chat functionality.

### Key Directories

- **[src/routes/](src/routes/CLAUDE.md)** — File-based routing
  - `+layout.ts`, `+layout.svelte` — app shell with SPA mode enabled
  - `+page.server.ts`, `+page.svelte` — authenticated home page
  - `api/auth/[...all]/+server.ts` — better-auth handler
  - `api/upload/+server.ts` — PDF upload, summarize, vectorize
  - `api/chat/+server.ts` — RAG-based chat
  - `api/papers/[id]/+server.ts` — paper GET (details) and DELETE
- **[src/lib/](src/lib/CLAUDE.md)** — Shared library code
  - [components/](src/lib/components/CLAUDE.md) — Atomic Design system (~40 components)
  - [icons/](src/lib/icons/CLAUDE.md) — SVG icon library
  - [scss/](src/lib/scss/CLAUDE.md) — Global styles, theming
  - [stores/](src/lib/stores/CLAUDE.md) — Svelte stores (auth, theme)
  - [utils/](src/lib/utils/CLAUDE.md) — Shared types and utilities
  - [data/](src/lib/data/CLAUDE.md) — Static site data
  - [server/](src/lib/server/CLAUDE.md) — Server-only (database, LLM, auth)
- **`src/hooks.server.ts`** — SvelteKit server hook for auth

### Key Concepts

**Authentication**: better-auth with email/password flows
- Sessions stored in PostgreSQL
- Client uses `getAuthClient()` from `$lib/auth-client.ts` (lazy browser-only initialization via `$app/environment`)
- Server checks session via `auth.api.getSession({ headers })` in API routes

**Database**: PostgreSQL with Drizzle ORM
- Schema: `user`, `session`, `account`, `verification` (auth tables, auto-generated)
- Schema: `paper`, `reference` (content), `documents` (pgvector table, managed by PGVectorStore)
- Schema: `job` (upload job tracking; statuses: pending/processing/done/failed/cancelled)

**LLM & RAG**: LangChain orchestration
- `ChatOpenAI` with `temperature: 0.7` for conversational chat responses
- `OpenAIEmbeddings` for vector generation
- `PGVectorStore` (`tableName: "documents"`) for similarity search
- RAG agent receives full conversation history for coherent multi-turn chat
- AI chat responses rendered as markdown HTML via `marked` library

**Upload Processing**: Background job with cancellation support
- `src/lib/server/upload-jobs.ts` holds a module-level `Map<jobId, AbortController>`
- `processUpload()` checks `signal.aborted` at each major step (PDF extraction, summarization, vectorization)
- Paper deletion aborts any active upload job for that paper
- PDF text is cleaned of page markers (`-- N of M --`) before being sent to the LLM
- `parser.destroy()` and `vectorStore.end()` are called in `finally` blocks to ensure cleanup even on error
- On job failure, error message is stored in `job.error` and preserved in `PapersyFile.uploadError` so the UI can display the reason

**Data Loading**: Lazy and incremental
- Initial page load fetches only basic paper info (`id`, `name`, `jobStatus`) -- no summary fields
- Full `summaryData` fetched on-demand via `GET /api/papers/[id]` when user clicks a paper
- Upload no longer auto-selects the new paper; current selection is preserved
- Failed papers display error reason in Summary tab; Chat tab is locked until paper is deleted and re-uploaded

**Styling & Theming**: CSS-driven via `data-theme` attribute on `<html>`

---

## Svelte MCP Server

You are able to use the Svelte MCP server with four tools:

1. **list-sections** — discover available documentation (use FIRST)
2. **get-documentation** — fetch full content for specific sections
3. **svelte-autofixer** — analyze Svelte code before sending (MANDATORY)
4. **playground-link** — generate Svelte Playground links (post-completion, user-confirmed only)
