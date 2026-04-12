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
- `ORIGIN` — Server origin for CORS and auth redirects
- `BETTER_AUTH_SECRET` — Secret key for better-auth session signing
- `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` — PostgreSQL connection details
- `CHAT_MODEL_URL` — OpenAI-compatible LLM endpoint (e.g., local Ollama at `http://localhost:11434/v1`)
- `EMBEDDING_URL` — OpenAI-compatible embedding endpoint

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
  - `api/papers/[id]/+server.ts` — paper deletion
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

**LLM & RAG**: LangChain orchestration
- `ChatOpenAI` for summarization (with Zod schema validation)
- `OpenAIEmbeddings` for vector generation
- `PGVectorStore` (`tableName: "documents"`) for similarity search

**Styling & Theming**: CSS-driven via `data-theme` attribute on `<html>`

---

## Svelte MCP Server

You are able to use the Svelte MCP server with four tools:

1. **list-sections** — discover available documentation (use FIRST)
2. **get-documentation** — fetch full content for specific sections
3. **svelte-autofixer** — analyze Svelte code before sending (MANDATORY)
4. **playground-link** — generate Svelte Playground links (post-completion, user-confirmed only)
