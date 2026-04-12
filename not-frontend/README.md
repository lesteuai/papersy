# Papersy

Research paper summarization and RAG-based chat. Upload a PDF, get a structured summary, then chat with your paper.

Built with SvelteKit 5 + adapter-node, LangChain, PostgreSQL (pgvector), and better-auth.

---

## Features

- **Login / Logout** — email/password auth via better-auth, sessions stored in PostgreSQL
- **Upload** — extract PDF text, summarize with LLM (structured output: summary, key findings, methodology, limitations, references), save to DB, vectorize chunks into pgvector, delete the PDF
- **Chat** — RAG-based chat scoped to the selected paper using LangChain agent + pgvector similarity search
- **Delete** — removes paper summary, references, and all vector chunks

---

## Prerequisites

- Node.js 20+
- PostgreSQL with pgvector extension (see `docker/postgres.yaml`)
- An OpenAI-compatible LLM endpoint (local or remote) for chat and embeddings

---

## Setup

**1. Start the database**
```sh
# from project root
docker compose -f docker/postgres.yaml up -d
```

**2. Install dependencies**
```sh
cd frontend
npm install
```

**3. Configure environment**
```sh
cp ../.env.example .env
# fill in CHAT_MODEL_URL, EMBEDDING_URL, and verify PG_* values
```

`.env` values:
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ORIGIN` | Server origin (e.g. `http://localhost:5173`) |
| `BETTER_AUTH_SECRET` | Session signing secret (min 32 chars) |
| `PG_HOST/PORT/USER/PASSWORD/DATABASE` | Direct PG connection for pgvector |
| `CHAT_MODEL_URL` | OpenAI-compatible chat LLM endpoint |
| `EMBEDDING_URL` | OpenAI-compatible embedding endpoint |

**4. Push database schema**
```sh
npm run auth:schema   # generate better-auth tables
npm run db:push       # create tables in PostgreSQL
```

**5. Start dev server**
```sh
npm run dev
```

---

## Development

```sh
npm run dev           # dev server at http://localhost:5173
npm run build         # production build
npm run preview       # preview production build
npm run check         # type-check
npm run lint          # lint + format check
npm run db:studio     # Drizzle Studio (DB browser)
```

---

## Architecture

```
src/
├── hooks.server.ts              ← auth per-request injection
├── routes/
│   ├── +page.server.ts          ← load user's papers on SSR
│   ├── +page.svelte             ← app shell (login / file manager / chat)
│   └── api/
│       ├── auth/[...all]/       ← better-auth catch-all
│       ├── upload/              ← POST: PDF pipeline
│       ├── chat/                ← POST: RAG chat
│       └── papers/[id]/         ← DELETE: paper + vectors
└── lib/
    ├── auth-client.ts           ← shared better-auth browser client
    ├── server/
    │   ├── auth.ts              ← better-auth instance
    │   ├── llm.ts               ← LangChain: embeddings, vector store, RAG agent
    │   └── db/
    │       ├── schema.ts        ← paper + reference tables
    │       └── auth.schema.ts   ← generated auth tables
    └── components/dedicated/app/
        ├── types.ts             ← PapersyFile, SummaryData, ChatMessage
        ├── LoginCard.svelte
        ├── FilePanel.svelte
        ├── SummaryView.svelte
        ├── ContentPanel.svelte
        └── ChatView.svelte
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `user` | better-auth users |
| `session` | active sessions |
| `account` | OAuth accounts (unused currently) |
| `verification` | email verification tokens |
| `paper` | uploaded paper metadata + summary |
| `reference` | 1-to-many references per paper |
| `documents` | pgvector chunks with `{ paperId, source }` metadata |
