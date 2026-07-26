# Project Configuration

## Stack

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Package Manager**: npm
- **Build**: `adapter-node` (SPA mode: `ssr = false` in `+layout.ts`)
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, better-auth, mdsvex, mcp, langchain, markitdown-ts, zod, pg, postgres, drizzle-orm

## Environment Variables

Server-side configuration (`.env`, documented in `.env.example`):

| Variable | Description |
|---|---|
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | PostgreSQL connection details. `src/lib/server/db/index.ts` and `drizzle.config.ts` build the connection string from these directly; there is no separate `DATABASE_URL` variable. |
| `ORIGIN` | Production server origin for CORS and auth redirects |
| `ORIGIN_DEV` | Development server origin (used when `NODE_ENV` is not `production`; falls back to `ORIGIN`) |
| `BETTER_AUTH_SECRET` | Secret key for better-auth session signing |
| `OPENROUTER_API_KEY` | Bearer token for every OpenRouter call: chat, embeddings, health checks, and the budget checks below |
| `REASONING_MODEL` | Chat model id sent to OpenRouter, e.g. `google/gemma-4-31b-it` |
| `EMBEDDING_MODEL` | Embedding model id sent to OpenRouter, e.g. `openai/text-embedding-3-small` |
| `BODY_SIZE_LIMIT` | SvelteKit request body size limit (e.g., `100M` for document uploads) |
| `MAX_CHARS` | Maximum extracted characters accepted per uploaded document (`src/lib/server/limits.ts`). Optional; defaults to `500000` when unset. A value that is not a positive finite number is ignored with a logged warning, so `0` does not block all uploads. This is the only document size limit; there is no page-count limit. |

The old `CHAT_MODEL_URL`, `EMBEDDING_URL`, `CHAT_MODEL_API_KEY` and `EMBEDDING_URL_KEY` variables no longer exist. Chat and embeddings both go through `https://openrouter.ai/api/v1`, authenticated with the single `OPENROUTER_API_KEY`.

### Gotcha: `sslmode=require` is mandatory

Both `src/lib/server/db/index.ts` and `drizzle.config.ts` build the connection string from the `PG_*` variables and set `PG_SSL` to true. The managed Postgres host refuses insecure connections, and the failure mode when this is missing is not a clear error: the connection attempt hangs silently, and `drizzle-kit migrate` stalls with no useful message. If a migration or a query hangs with no output, check that `PG_SSL` set to true before looking anywhere else.

## OpenRouter Budget

Two endpoints report two different numbers. Reading one as the other is an easy and consequential mistake:

- `GET /api/v1/key` reports **this API key's own spend cap**: `limit` (the dollar cap this specific key is allowed to spend, or `null` if uncapped), `limit_remaining` (dollars left before this key is throttled), and `usage` (dollars this key has spent).
- `GET /api/v1/credits` reports **the account's purchased balance**: `total_credits` (dollars ever purchased on the account) and `total_usage` (dollars spent across the whole account, by every key on it).

A key's cap and the account's balance are independent numbers; a key can be capped well below what the account actually holds. Verified live against this project's key:

```
GET /api/v1/key      -> limit: 1, limit_remaining: 0.82
GET /api/v1/credits  -> total_credits: 10, total_usage: 0.178
```

This key has a $1 cap with $0.82 left before it gets throttled. The account behind it has purchased $10 total and spent $0.178 of that across all its keys. `limit_remaining` answers "how much can this key still spend before it stops working"; `total_credits` and `total_usage` answer "how much has the account bought and spent overall." They are not interchangeable, and neither one derives from the other.

### Check this key's spend cap

```bash
curl -s https://openrouter.ai/api/v1/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

Relevant fields in the response: `limit`, `limit_remaining`, `usage`.

### Check the account's purchased credits

```bash
curl -s https://openrouter.ai/api/v1/credits \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

Relevant fields in the response: `total_credits`, `total_usage`.

Run the `/key` check before a test suite that sends many chat or embedding calls through this specific key. Run the `/credits` check to see whether the account overall needs topping up.
