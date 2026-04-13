# Papersy

Research paper summarization and RAG-based chat. Upload a PDF, get a structured summary, then chat with your paper.

Built with SvelteKit 5 + adapter-node, LangChain, PostgreSQL (pgvector), and better-auth.

---

## Features

- **Login / Logout** — email/password auth via better-auth, sessions stored in PostgreSQL
- **Upload** — extract PDF text, summarize with LLM (structured output: summary, key findings, methodology, limitations, references), save to DB, vectorize chunks into pgvector, delete the PDF
- **Chat** — RAG-based chat scoped to the selected paper using LangChain agent + pgvector similarity search
- **Delete** — removes paper summary, references, and all vector chunks
- **Automated Pipeline**: Scheduled job processing with async task queue and status tracking
- **Usage Dashboard**: Token consumption, cost estimates, and processing stats
- **Full-Stack SvelteKit**: Single unified app — frontend, backend routes, and API in one project

---

## Prerequisites

- Node.js 20+
- PostgreSQL with pgvector extension (see `docker/postgres.yaml`)
- An OpenAI-compatible LLM endpoint (local or remote) for chat and embeddings

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
# fill in CHAT_MODEL_URL, EMBEDDING_URL, and verify PG_* values
```

Available environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ORIGIN` | Server origin (e.g. `http://localhost:5173`) |
| `BETTER_AUTH_SECRET` | Session signing secret (min 32 chars) |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | Direct PG connection for pgvector |
| `CHAT_MODEL_URL` | OpenAI-compatible chat LLM endpoint (e.g., `http://localhost:11434/v1`) |
| `EMBEDDING_URL` | OpenAI-compatible embedding endpoint |

**4. Push database schema**
```sh
pnpm run db:generate       # create tables in PostgreSQL
pnpm run db:migrate   # generate table schema
```

**5. Start dev server**
```sh
pnpm run dev
```

Open http://localhost:5173 in your browser.

---

### Command Reference

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
| `pnpm run db:push` | **Dev** | Push schema changes directly to database (dev only) |
| `pnpm run db:migrate` | **Prod** (deployment) | Run pending migrations on database |
| `pnpm run db:studio` | **Dev** | Open Drizzle Studio for interactive database browser |
| `pnpm run auth:schema` | **Dev** | Generate better-auth schema types (run after auth changes) |

### Debugging

To debug API routes and server-side code:

1. Launch the VS Code debugger using the included launch configuration (Run > Start Debugging or press F5)
2. Add `debugger;` statements to `.ts` files in `src/routes/api/` to set breakpoints
3. The debugger will pause execution when a breakpoint is hit, allowing you to inspect variables and step through code

---

### High-Level Overview

```
src/
├── hooks.server.ts              ← auth per-request injection
├── routes/
│   ├── +layout.ts/svelte        ← app shell with SPA mode enabled
│   ├── +page.server.ts          ← load user's papers on SSR
│   ├── +page.svelte             ← app shell (login / file manager / chat)
│   └── api/
│       ├── auth/[...all]/       ← better-auth catch-all
│       ├── upload/              ← POST: PDF pipeline (async job)
│       ├── jobs/[id]/           ← GET: poll job status
│       ├── chat/                ← POST: RAG chat
│       └── papers/[id]/         ← GET: fetch paper; DELETE: paper + vectors
└── lib/
    ├── auth-client.ts           ← shared better-auth browser client
    ├── components/              ← Atomic Design system (~40 components)
    ├── icons/                   ← SVG icon library
    ├── scss/                    ← global styles + theming
    ├── stores/                  ← auth and theme stores
    ├── utils/                   ← shared types and utilities
    ├── data/                    ← static site data (SEO, meta)
    └── server/
        ├── auth.ts              ← better-auth instance
        ├── llm.ts               ← LangChain: embeddings, RAG agent, schemas
        └── db/
            ├── index.ts         ← Drizzle ORM client
            ├── schema.ts        ← custom tables (paper, reference, job)
            └── auth.schema.ts   ← generated auth tables
```

### Core Concepts

**Authentication** ([details](./src/lib/server/CLAUDE.md))
- better-auth with email/password flows
- Sessions stored in PostgreSQL
- Client uses `getAuthClient()` from `$lib/auth-client.ts` (lazy, browser-only)
- Server validates session via `auth.api.getSession({ headers })` in API routes

**Database** ([details](./src/lib/server/CLAUDE.md))
- PostgreSQL with Drizzle ORM
- Auth tables: `user`, `session`, `account`, `verification` (auto-generated)
- Content tables: `paper`, `reference`, `job` (custom)
- Vector table: `documents` (pgvector, managed by PGVectorStore)

**LLM & RAG** ([details](./src/lib/server/CLAUDE.md))
- LangChain orchestration
- `ChatOpenAI` for summarization (with Zod schema validation)
- `OpenAIEmbeddings` for vector generation
- `PGVectorStore` for similarity search, scoped per paper

**Styling & Theming**
- SCSS with CSS custom properties
- CSS-driven theming via `data-theme` attribute on `<html>`
- Responsive design with semantic breakpoints

### API Routes ([details](./src/routes/CLAUDE.md))

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/[...all]` | GET/POST | better-auth handler (sign-in, sign-up, sign-out, etc.) |
| `/api/upload` | POST | Submit PDF, returns jobId for async processing |
| `/api/jobs/[id]` | GET | Poll job status (pending/processing/done/failed) |
| `/api/chat` | POST | RAG-based chat with paper context |
| `/api/papers/[id]` | GET | Fetch paper metadata + summary |
| `/api/papers/[id]` | DELETE | Delete paper, references, and vectors |

### Database Schema

| Table | Purpose |
|---|---|
| `user` | better-auth users |
| `session` | active sessions |
| `account` | OAuth accounts (unused currently) |
| `verification` | email verification tokens |
| `paper` | uploaded paper metadata + summary |
| `reference` | 1-to-many references per paper |
| `job` | upload job tracking (pending/processing/done/failed) |
| `documents` | pgvector chunks with `{ paperId, source }` metadata |

---

## Detailed Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Project configuration, environment, and high-level architecture
- **[src/routes/CLAUDE.md](./src/routes/CLAUDE.md)** — File-based routing, page state, and API contracts
- **[src/lib/CLAUDE.md](./src/lib/CLAUDE.md)** — Library structure, component patterns, and public exports
- **[src/lib/server/CLAUDE.md](./src/lib/server/CLAUDE.md)** — Server modules (auth, database, LLM)

---

## Technology Stack

- **Frontend:** SvelteKit 5, Svelte 5 with runes, SCSS, Tailwind (utilities only)
- **Backend:** SvelteKit adapter-node, TypeScript
- **Auth:** better-auth with email/password provider
- **Database:** PostgreSQL + pgvector, Drizzle ORM
- **LLM:** LangChain, OpenAI-compatible APIs (local or remote)
- **Tools:** Prettier, ESLint, Vitest, Playwright, TypeScript

---

## Project Task Breakdown

---

## Phase 1: Project Setup & Infrastructure

- [x] Initialize Git repository with `.gitignore`, `README.md`, and branch strategy
- [x] Scaffold SvelteKit project with TypeScript
- [x] Configure environment variable management (`.env`, `$env/static/private`)
- [ ] Set up Docker and write base `Dockerfile`
- [x] Write `docker-compose.yml` to orchestrate backend, frontend, and database services locally
- [x] Set up PostgreSQL
- [x] Enable pgvector extension

---

## Phase 2: Data Ingestion

- [x] Build a PDF ingestion module that accepts local files or URLs
- [x] Integrate a parsing library (e.g., `pdf-parse` or `pdfjs-dist`) to extract clean text
- [ ] Handle edge cases: scanned PDFs, multi-column layouts, references sections
- [x] Store raw extracted text in the database, linked to the uploaded file
- [ ] Write a batch ingestion flow that processes multiple PDFs in one run
- [ ] Add basic metadata extraction: title, authors, publication date (via regex or LLM)

---

## Phase 3: LLM Summarization Pipeline

- [x] Design a structured prompt template for paper summarization:
  - Summary
  - Key findings
  - References
  - Methodology
  - Limitations
- [x] Integrate OpenAI API as the summarization model
- [ ] Implement long-context chunking strategy for papers exceeding token limits
- [x] Store structured summaries as JSON in the database, linked to the source paper
- [ ] Add token usage logging per request (model, prompt tokens, completion tokens, cost estimate)

---

## Phase 4: Semantic Search (RAG Layer)

- [x] Integrate OpenAI `text-embedding-3-small` for paper embeddings
- [x] Store embeddings in PostgreSQL using pgvector
- [x] Chunk paper text and upsert embeddings into the vector store on ingestion
- [x] Build a semantic search endpoint: given a query, return top-k relevant papers
- [ ] Combine vector search with keyword metadata filters (author, date, topic)

---

## Phase 5: Backend API (SvelteKit Server Routes)

- [x] Scaffold API routes under `src/routes/api/`
- [x] Endpoints built:
  - `POST /api/upload`: upload and process a PDF
  - `GET /api/jobs/[id]`: poll job status
  - `POST /api/chat`: RAG-based chat with paper context
  - `GET /api/papers/[id]`: retrieve paper details
  - `DELETE /api/papers/[id]`: delete paper and vectors
- [x] Input validation and error handling

---

## Phase 6: Job Scheduler (Pipeline Orchestration)

- [x] Async job processing for PDF uploads
- [x] Job status tracking: `pending`, `processing`, `done`, `failed`
- [ ] Set up a scheduled job to watch for new PDFs (folder, S3 bucket or Supabase Storage bucket)
- [ ] Use a lightweight scheduler (e.g., `APScheduler` or a serverless cron trigger)
- [ ] Send a notification (email or webhook) when a batch job completes

---

## Phase 7: Frontend (SvelteKit)

- [x] Build paper upload interface
- [x] Build paper list view with metadata and summary preview
- [x] Build paper detail view with full structured summary
- [x] Build RAG-based chat interface scoped to selected paper
- [ ] Build semantic search bar with results ranked by relevance
- [ ] Build a usage dashboard: papers processed, tokens consumed, estimated cost
- [x] Ensure responsive layout and clean, readable typography

---

## Phase 8: Containerization & Cloud Deployment

- [ ] Finalize and optimize all Dockerfiles (multi-stage builds where applicable)
- [ ] Test full stack locally with `docker-compose up`
- [ ] Choose cloud target: Cloud Run (GCP), Azure Container Apps, or AWS ECS
- [ ] Write infrastructure-as-code config (e.g., `cloudbuild.yaml` or `terraform` basics)
- [ ] Set up CI/CD pipeline (GitHub Actions):
  - Lint and test on push
  - Build and push Docker image to container registry
  - Deploy to cloud on merge to `main`
- [ ] Configure secrets management in the cloud environment (not hardcoded `.env`)
- [ ] Set up a managed cloud database (Amazon RDS)

---

## Phase 9: Testing & Quality

- [ ] Write unit tests for ingestion, chunking, and prompt-building logic
- [ ] Write integration tests for API routes
- [ ] Test pipeline with a diverse set of papers (short, long, multi-column, scanned)
- [ ] Load test the API with concurrent ingestion requests

---

## Phase 10: Deployment & Documentation

- [ ] Deploy SvelteKit app to Vercel
- [ ] Configure environment variables in cloud deployment
- [ ] Set up CI/CD pipeline (GitHub Actions): lint, test, deploy on merge to `main`
- [ ] Finalize README with project overview, architecture, setup, and env reference
- [ ] Add architecture diagram (system components and data flow)
- [ ] Record a short demo video walking through the app
- [ ] Write a brief blog post or LinkedIn article explaining design decisions
- [ ] Deploy a live public demo instance

---

## Milestones

| Milestone | Phases | Goal |
|---|---|---|
| MVP | 1–3 | Ingest a PDF and get a structured LLM summary |
| RAG Search | 4–5 | Query papers via API and chat with RAG context |
| Async Processing | 6 | Background job processing with status polling |
| Full Product | 7 | Usable frontend for non-technical users with chat |
| Production Ready | 8–10 | Deployed, tested, documented, and demo-able |
