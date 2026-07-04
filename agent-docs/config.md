# Project Configuration

## Stack

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Package Manager**: npm
- **Build**: `adapter-node` (SPA mode: `ssr = false` in +layout.ts)
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, better-auth, mdsvex, mcp, langchain, pdf-parse, zod, pg, drizzle-orm, pgvector

## Environment Variables

Server-side configuration (`.env`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ORIGIN` | Production server origin for CORS and auth redirects |
| `ORIGIN_DEV` | Development server origin (used when `NODE_ENV` is not `production`; falls back to `ORIGIN`) |
| `BETTER_AUTH_SECRET` | Secret key for better-auth session signing |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | PostgreSQL connection details |
| `CHAT_MODEL_URL` | OpenAI-compatible LLM endpoint (e.g., local Ollama at `http://localhost:11434/v1`) |
| `EMBEDDING_URL` | OpenAI-compatible embedding endpoint |
| `EMBEDDING_URL_KEY` | API key for the embedding endpoint (use `local` for local models) |
| `BODY_SIZE_LIMIT` | SvelteKit request body size limit (e.g., `100M` for large PDF uploads) |
