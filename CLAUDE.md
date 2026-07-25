# Papersy

A full-stack research paper summarization and retrieval-augmented generation (RAG) chat application. Built with SvelteKit 5 (SPA mode) + TypeScript + PostgreSQL + LangChain. Users upload PDFs, the system automatically extracts summaries via LLM, and provides RAG-based chat for deeper exploration.

## Quick Start

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Build**: `adapter-node` (SPA mode: `ssr = false`)
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Key libraries**: better-auth, langchain, pdf-parse, pgvector, zod

## High-Level Architecture

**Full-stack SPA:** Pages render client-side. Authentication via better-auth with PostgreSQL session storage. REST API exposes document management and chat. Background jobs handle async PDF processing with cancellation support.

**Core flow:** Upload PDF → LLM extracts title + summary + references → stored in PostgreSQL + vectorized → RAG chat retrieves relevant sections → LLM generates coherent responses.

## Key Entry Points

- `src/routes/+page.svelte` — App shell (Login UI or File Manager + Content)
- `src/routes/api/upload/+server.ts` — PDF upload & background processing
- `src/routes/api/chat/+server.ts` — RAG-based chat endpoint
- `src/lib/server/llm.ts` — LangChain orchestration

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
- Server data flow via `+page.server.ts`

**Code Organization:**
- Helpers defined above the code that uses them
- Related things collocated (content next to handlers)
- No over-engineering — functions do one thing

**Authentication:**
- better-auth with email/password
- Server validates session on every API route
- Client uses lazy-loaded `getAuthClient()` for signup/signin

**Database:**
- Drizzle ORM for type safety
- PostgreSQL with pgvector extension
- Auto-generated auth tables; custom tables for papers, references, jobs

**LLM & Vectorization:**
- LangChain with OpenAI-compatible APIs (local or remote)
- Structured output via Zod schemas
- PGVectorStore for similarity search (4 results per query)

## Gotchas & Notes

- **Upload cancellation**: Deleting a paper aborts any active upload job mid-processing
- **Lazy data loading**: Papers load without summary data; full summary fetched on demand
- **PDF cleaning**: Page markers (`-- N of M --`) stripped before LLM processing
- **Title extraction**: LLM infers paper name from first page; overwrites upload filename if found
- **Job statuses**: Defined in `JobStatus` enum (`src/lib/utils/types.ts`). States: pending → processing → storing → done (or failed/cancelled). Database schema uses `jobStatusEnum` (pgEnum via Drizzle). Client polls and resumes any job in pending/processing/storing state on page reload
- **Embedding health check**: Before vectorization (storing phase) and before RAG retrieval, the system checks embedding service health. If unavailable, the upload fails or chat returns 503
- **Service health checks**: Both LLM and embedding services are pinged (5s timeout) before use to fail fast with 503
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

- **Desktop**: Two-column layout (28% files, 72% content)
- **Mobile portrait**: Single-column with panel toggle (files vs. content)
- Breakpoints: 320px (iPhone SE) | 768px (tablet) | 1201px (desktop)

## Svelte MCP Server

Four tools available for working with Svelte:
1. **list-sections** — discover documentation
2. **get-documentation** — fetch full content
3. **svelte-autofixer** — analyze code before sending
4. **playground-link** — generate Svelte Playground links
