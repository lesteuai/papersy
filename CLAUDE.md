# Papersy

A full-stack project-based agent workspace. Built with SvelteKit 5 (SPA mode) + TypeScript + PostgreSQL + LangChain. A user owns projects; each project holds many chat sessions and one shared knowledge base of uploaded documents (PDF, Markdown, text). Every session in a project retrieves from that same knowledge base via hybrid (vector + full-text) search, so the agent answers grounded in actual document content and names its source.

## Quick Start

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Build**: `adapter-node` (SPA mode: `ssr = false`)
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Key libraries**: better-auth, langchain, markitdown-ts, pgvector, zod

## High-Level Architecture

**Full-stack SPA:** Pages render client-side (`ssr = false` in `src/routes/+layout.ts`); there is no `+page.server.ts` anywhere. The one server load is `src/routes/+layout.server.ts`, which resolves the better-auth session so a refresh on any route keeps the user logged in. Authentication via better-auth with PostgreSQL session storage. REST API exposes project, session, document and chat management. Document ingestion runs as a cancellable background task.

**Core flow:** Upload a document → `markitdown-ts` extracts text → chunked, embedded and indexed with both a vector column and a `tsvector` column → chat message triggers hybrid search (RRF-fused vector + full-text) over the project's whole knowledge base → agent answers, citing the source document, or says it doesn't know and suggests a Google query.

## Key Entry Points

- `src/routes/+page.svelte` — App shell (Login UI or project list)
- `src/routes/p/[projectId]/+layout.svelte` — Project shell: sessions, documents, two-column layout
- `src/routes/api/projects/[projectId]/documents/+server.ts` — Document upload & background ingestion
- `src/routes/api/chat/+server.ts` — Agent chat endpoint
- `src/lib/server/retrieval.ts` — Hybrid search (vector + full-text, fused with RRF)
- `src/lib/server/agent.ts` — LangChain agent construction
- `src/lib/server/llm.ts` — OpenRouter clients (chat + embeddings)

## Directory Overview

- **`src/routes/`** — SvelteKit file-based routing (pages + API routes)
- **`src/lib/`** — Shared library: components (Atomic Design), icons, styles, stores, types, server modules
- **`src/hooks.server.ts`** — Per-request auth validation

## Documentation

Detailed documentation organized by topic:

- [Configuration](agent-docs/config.md) — Framework, environment variables
- [Architecture](agent-docs/architecture.md) — System design, key concepts, data flow
- [src/lib Overview](agent-docs/lib-overview.md) — Library structure, patterns, imports
- [Components](agent-docs/components.md) — Atomic Design system, props, usage
- [SCSS & Styling](agent-docs/scss.md) — Theme system, breakpoints, design tokens
- [Stores](agent-docs/stores.md) — Svelte stores (auth, theme)
- [Types & Utilities](agent-docs/types.md) — Shared TypeScript types, enums (JobStatus)
- [Static Data](agent-docs/data.md) — Site metadata
- [Server Modules](agent-docs/server.md) — Database, auth, LLM orchestration
- [Routes & API](agent-docs/routes.md) — Page routing, REST endpoints

## Key Conventions

**Naming:**
- `handle` prefix for event handlers
- `get` prefix for data fetchers
- Components: PascalCase, descriptive names

**State Management:**
- Minimal stores (`loggedIn`, `theme`)
- Local state via Svelte runes preferred
- Every page fetches its own data client-side on mount; there is no `+page.server.ts` anywhere. The sole exception is `src/routes/+layout.server.ts`, which returns only `{ loggedIn }`

**Code Organization:**
- Helpers defined above the code that uses them
- Related things collocated (content next to handlers)
- No over-engineering — functions do one thing

**Authentication:**
- better-auth with email/password
- Server validates session on every API route
- Client uses lazy-loaded `getAuthClient()` for signup/signin

**Database:**
- Drizzle ORM for type safety, and the sole owner of every table (no separate vector-store-managed table)
- PostgreSQL with pgvector extension, plus native full-text search (`tsvector`/`tsquery`)
- Auto-generated auth tables; custom tables for projects, chat sessions, chat messages, documents, document chunks

**LLM & Retrieval:**
- LangChain with OpenRouter (`https://openrouter.ai/api/v1`) for both chat and embeddings
- Hybrid search: pgvector cosine arm + Postgres full-text arm, fused with Reciprocal Rank Fusion (k=60) down to 5 chunks
- Single `retrieve` tool scoped to a project; agent cites its source document per factual claim

## Gotchas & Notes

- **Upload cancellation**: Deleting a document or its project aborts any in-flight ingestion mid-processing (`activeIngestions` map in `ingest-jobs.ts`)
- **No page limit**: Uploads have no page-count limit; the only size limit is the `MAX_CHARS` env var, in extracted characters, defaulting to 500,000 when unset or invalid (`src/lib/server/limits.ts`). A long but sparse document can pass as long as its extracted text fits.
- **PDF extraction is unchanged**: `markitdown-ts` delegates PDF handling to `pdf-parse` internally, so extraction quality is identical to before this pivot. `pdf-parse` is not a direct dependency and is not imported anywhere in `src/`; it survives only transitively.
- **Session auto-labels**: `chatSession.name` is nullable; `NULL` means the session was never explicitly renamed, and its display label is derived from the first user message at read time. Only a PATCH to `/api/sessions/[sessionId]` ever writes the column, so a user-set name can never be silently overwritten.
- **Document statuses**: Defined in `JobStatus` enum (`src/lib/utils/types.ts`), reused directly on `document.status` (no separate `job` table). States: pending → processing → storing → done (or failed/cancelled). Client polls and resumes any document in pending/processing/storing state without a page reload.
- **Embedding health check**: Before the storing step of ingestion, and before chat retrieval, the system checks embedding service health. If unavailable, ingestion fails or chat returns 503.
- **Service health checks**: Both the chat model and embedding service are pinged (5s timeout) against `https://openrouter.ai/api/v1/models` before use, to fail fast with 503.
- **`sslmode=require` is mandatory**: `src/lib/server/db/index.ts` and `drizzle.config.ts` both have `PG_SSL` set to true; the managed host refuses insecure connections, and the failure mode without it is a silent hang during `drizzle-kit migrate`, not a clear error.
- **OpenRouter budget**: `agent-docs/config.md` documents how to check the current key's spend cap (`GET /api/v1/key`) versus the account's purchased balance (`GET /api/v1/credits`); the two are different numbers.
- **Auth is wide open for now**: Email verification is off and the old 100-user sign-up cap is removed, so sign-up succeeds for anyone reaching the deployed origin.
- **Browser tests use system Chrome**: Both `playwright.config.ts` and the `playwright()` provider options in `vite.config.ts` pass `channel: 'chrome'`, because the bundled Chromium download does not work in this environment.
- **Playwright's webServer must use port 5173**: not the default 4173 — `.env` sets `ORIGIN=http://localhost:5173` and better-auth rejects requests from any other origin.
- **Prism theme**: Code syntax highlighting is hardcoded, does not respond to dark mode
- **svg-text-stroke animation**: Uses legacy `var(--text-color)` instead of `var(--color--text)`

## Development Workflow

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Generate auth schema
npm run auth:schema

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run preview
```

## Responsive Behavior

- **Desktop**: Two-column layout (28% side panel with sessions/documents, 72% content)
- **Mobile portrait**: Single-column with panel toggle (sessions/documents vs. content)
- Breakpoints: 320px (iPhone SE) | 768px (tablet) | 1201px (desktop)

## Svelte MCP Server

Four tools available for working with Svelte:
1. **list-sections** — discover documentation
2. **get-documentation** — fetch full content
3. **svelte-autofixer** — analyze code before sending
4. **playground-link** — generate Svelte Playground links
