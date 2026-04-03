## Project Configuration

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Adapter**: `adapter-node` (SSR enabled)
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, drizzle, better-auth, mdsvex, mcp, langchain, pdf-parse, zod, pg

---

## Architecture

Full-stack SSR application. Pages render server-side. Auth is session-based (PostgreSQL via better-auth). LLM operations run server-side via LangChain.

**Key directories:**
- `src/routes/` — pages + API routes (`api/upload`, `api/chat`, `api/papers/[id]`, `api/auth/[...all]`)
- `src/lib/server/` — server-only: `auth.ts`, `db/`, `llm.ts`
- `src/lib/components/dedicated/app/` — Papersy UI components
- `src/hooks.server.ts` — per-request auth injection

**Environment variables required** (`.env`):
```
DATABASE_URL=postgres://postgres:1@localhost:5432/postgres
ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=<min 32 chars>
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=1
PG_DATABASE=postgres
CHAT_MODEL_URL=<openai-compatible endpoint>
EMBEDDING_URL=<openai-compatible endpoint>
```

---

## Database

Run before first use:
```sh
npm run auth:schema   # generate better-auth tables into auth.schema.ts
npm run db:push       # push schema to PostgreSQL (requires TTY confirmation)
```

Tables: `user`, `session`, `account`, `verification` (auth), `paper`, `reference` (content), `documents` (pgvector, managed by PGVectorStore).

---

## Available Scripts

```sh
npm run dev           # start dev server
npm run build         # production build
npm run preview       # preview production build
npm run check         # svelte-check + tsc
npm run lint          # prettier + eslint
npm run format        # prettier write
npm run auth:schema   # regenerate auth.schema.ts from auth.ts
npm run db:push       # push drizzle schema to DB
npm run db:generate   # generate migration files
npm run db:studio     # open drizzle studio
```

---

## Svelte MCP Server

Access comprehensive Svelte 5 and SvelteKit documentation via four tools:

### 1. list-sections
Use this FIRST to discover all available documentation sections. Returns titles, use_cases, and paths.
Always use at the start when asked about Svelte or SvelteKit topics.

### 2. get-documentation
Fetch full documentation content for specific sections. After calling list-sections, fetch ALL relevant sections for the task.

### 3. svelte-autofixer
Analyzes Svelte code and returns issues and suggestions.
**MUST use this before sending any Svelte code to the user.** Keep calling until no issues remain.

### 4. playground-link
Generates a Svelte Playground link. Only call after user confirmation, never when code was written to project files.
