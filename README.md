# Papersy

A project-based agent workspace. Each project holds many chat sessions and one shared knowledge base of uploaded documents (PDF, Markdown, text). Every session in a project retrieves from that same knowledge base via hybrid (vector + full-text) search, so the agent answers grounded in actual document content and names its source.

Built with SvelteKit 5 (SPA mode) + TypeScript + PostgreSQL (pgvector) + LangChain + better-auth.

---

## Features

- **Login / Logout** — email/password auth via better-auth, sessions stored in PostgreSQL
- **Projects** — each project holds many chat sessions and one shared knowledge base
- **Document upload** — `markitdown-ts` extracts text from PDF, Markdown, or text files; content is chunked, embedded, and indexed with both a vector column and a `tsvector` column; ingestion runs as a cancellable background task with live status polling
- **Hybrid retrieval** — pgvector cosine search fused with Postgres full-text search via Reciprocal Rank Fusion, scoped to a project's whole knowledge base
- **Chat** — LangChain agent answers grounded in retrieved chunks, cites its source document per factual claim, or says it doesn't know and suggests a Google query
- **Web search fallback** — optional Tavily-backed `webSearch` tool when the knowledge base doesn't cover a query

---

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL with the pgvector extension (see `docker/postgres.yaml`)
- An OpenRouter API key for chat and embeddings

---

## Setup

**1. Start the database**
```sh
docker compose -f docker/postgres.yaml up -d
```

**2. Install dependencies**
```sh
pnpm install
```

**3. Configure environment**
```sh
cp .env.example .env
# Get BETTER_AUTH_SECRET key
./generate-better-auth-key
# fill in OPENROUTER_API_KEY and verify PG_* values
```

Available environment variables:

| Variable | Description |
|---|---|
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | PostgreSQL connection details |
| `PG_SSL` | Set to `true` for managed Postgres hosts that require SSL (mandatory for most managed hosts; a missing value causes migrations to hang silently instead of erroring) |
| `ORIGIN` | Production server origin (e.g. `http://localhost:5173`) |
| `ORIGIN_DEV` | Development server origin (falls back to `ORIGIN` when unset) |
| `BETTER_AUTH_SECRET` | Session signing secret (min 32 chars) |
| `OPENROUTER_API_KEY` | Bearer token for every OpenRouter call: chat, embeddings, health checks, and budget checks |
| `REASONING_MODEL` | Chat model id sent to OpenRouter (e.g. `google/gemma-4-31b-it`) |
| `EMBEDDING_MODEL` | Embedding model id sent to OpenRouter (e.g. `openai/text-embedding-3-small`) |
| `TAVILY_API_KEY` | API key for the Tavily web search tool. Optional; chat still works without it, falling back to knowledge-base-only answers |
| `BODY_SIZE_LIMIT` | SvelteKit request body size limit (e.g., `100M` for large document uploads) |
| `MAX_CHARS` | Maximum extracted characters accepted per uploaded document. Optional, defaults to `500000` |

**4. Push database schema**
```sh
pnpm run db:generate       # generate migration files from schema changes
pnpm run db:migrate        # run pending migrations on the database
```

**5. Generate the better-auth schema** (only needed after auth config changes)
```sh
pnpm run auth:schema
```

**6. Start dev server**
```sh
pnpm run dev
```

Open http://localhost:5173 in your browser.

---

## Command Reference

| Command | Context | Purpose |
|---|---|---|
| `pnpm run dev` | **Dev** | Start development server (Vite) with hot module reloading |
| `pnpm run build` | **Prod** | Create production-optimized build |
| `pnpm run preview` | **Prod** (testing before deploy) | Preview the production build locally |
| `pnpm run prepare` | Auto | SvelteKit sync (runs automatically on install) |
| `pnpm run check` | **Dev** / CI | Type-check TypeScript and Svelte components with strict mode |
| `pnpm run check:watch` | **Dev** | Run type-checking in watch mode (re-runs on file changes) |
| `pnpm run lint` | **Dev** / CI | Check code with Prettier and ESLint (no modifications) |
| `pnpm run format` | **Dev** | Auto-format all files with Prettier |
| `pnpm run test:unit` | **Dev** / CI | Run unit tests with Vitest |
| `pnpm run test` | **Dev** / CI | Run all tests (unit + E2E) |
| `pnpm run test:e2e` | **Dev** / CI | Run end-to-end tests with Playwright |
| `pnpm run db:generate` | **Dev** | Generate migration files from schema changes |
| `pnpm run db:migrate` | **Prod** (deployment) | Run pending migrations on database |
| `pnpm run db:studio` | **Dev** | Open Drizzle Studio for interactive database browser |
| `pnpm run auth:schema` | **Dev** | Generate better-auth schema types (run after auth changes) |

### Debugging

To debug API routes and server-side code:

1. Launch the VS Code debugger using the included launch configuration (Run > Start Debugging or press F5)
2. Add `debugger;` statements to `.ts` files in `src/routes/api/` to set breakpoints
3. The debugger will pause execution when a breakpoint is hit, allowing you to inspect variables and step through code

---

## Technology Stack

- **Frontend:** SvelteKit 5 (SPA mode), Svelte 5 with runes, SCSS with CSS custom properties, marked (markdown rendering)
- **Backend:** SvelteKit adapter-node, TypeScript
- **Auth:** better-auth with email/password provider, sessions in PostgreSQL
- **Database:** PostgreSQL + pgvector, Drizzle ORM (sole owner of every table, including auto-generated auth tables)
- **Retrieval:** Hybrid search — pgvector cosine arm + Postgres full-text (`tsvector`/`tsquery`) arm, fused with Reciprocal Rank Fusion
- **LLM:** LangChain via OpenRouter (`https://openrouter.ai/api/v1`) for both chat and embeddings
- **Document ingestion:** `markitdown-ts` (PDF extraction delegated internally to `pdf-parse`)
- **Web search:** Tavily (optional, backs the agent's `webSearch` tool)
- **Tools:** Prettier, ESLint, Vitest, Playwright, TypeScript
