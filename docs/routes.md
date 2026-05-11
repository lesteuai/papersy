# Routes & API

SvelteKit file-based routing. Full-stack SPA application with authenticated pages and REST API routes.

## Directory Structure

```
src/routes/
├── +layout.ts                    <- export const ssr = false
├── +layout.svelte                <- Header + outlet, global styles
├── +page.server.ts               <- load(): fetch user's papers from DB
├── +page.svelte                  <- App shell: Login page or File+Content panels
├── verify-email/+page.svelte     <- Email verification page (token-based)
├── forgot-password/+page.svelte  <- Forgot password form (send reset email)
├── reset-password/+page.svelte   <- Reset password form (verify token, set new password)
│
└── api/
    ├── auth/[...all]/+server.ts  <- GET/POST catch-all for better-auth
    ├── upload/+server.ts         <- POST: submit PDF, return { jobId, paperId } (async)
    ├── jobs/[id]/+server.ts      <- GET: poll job status
    ├── chat/+server.ts           <- POST: RAG agent, passes only last message
    └── papers/[id]/+server.ts   <- GET: fetch paper; DELETE: paper + cascading cleanup

(src/hooks.server.ts at project root handles auth per-request)
```

## Root Layout

### +layout.ts

`export const ssr = false` (SPA mode; pages rendered client-side).

### +layout.svelte

Renders `<Header />` and `<main>{@render children()}</main>`, imports `global.scss`.

## Root Page (`/`)

### +page.server.ts

`load()` runs on the client in SPA mode:
- If no session: `{ papers: [], loggedIn: false }`
- If session: fetches all papers with their most recent non-done job (`ne(job.status, 'done')`); returns `PapersyFile[]` with `jobId`/`jobStatus` for in-progress papers

### +page.svelte

App shell with three logical states:

1. **Auth** — `!$loggedIn`: centered `<LoginCard />` with sign in/up toggle
2. **File Manager + Summary** — `$loggedIn`, file selected: `<FilePanel />` + `<ContentPanel mode="summary" />`
3. **File Manager + Chat** — `$loggedIn`, chat mode active: same layout, chat view on right

**State:**
```ts
let files: PapersyFile[] = $state([]);
let selectedFileId = $state(null);
let selectedFile = $derived(files.find(f => f.id === selectedFileId));
let jobsInProgress = $state({});   // Record<paperId, { jobId, status, error? }>
let isProcessing = $derived(...);  // true if selectedFile has active job
let mode = $state('summary');
let messages = $state([]);         // ChatMessage[]
let uploading = $state(false);
let mobileActivePanel = $state('files');  // 'files' | 'content'
```

**Event Handlers:**

| Handler | What it does |
|---|---|
| `handleLogin(email, password)` | `getAuthClient()!.signIn.email(...)`, sets loggedIn |
| `handleUpload(file)` | POST `/api/upload`, adds paper with `jobStatus: 'pending'`, starts polling |
| `handleSelect(id)` | Sets selectedFileId; resets mode+messages when switching files |
| `handleDelete(id)` | DELETE `/api/papers/:id`, removes from files, stops polling |
| `handleSend(text)` | Adds user message + AI loading message, POST `/api/chat`, replaces loading with response |
| `handleBack()` | Resets mode+messages, toggles mobile panel or clears selectedFileId on desktop |

## API Routes

### POST `/api/upload`

Request: `FormData { file: File }` (PDF only). Response (202): `{ "jobId": "uuid", "paperId": "uuid" }`.

**Pipeline:**
1. Auth check (401), validate PDF (400)
2. Create empty `paper` row + `job` row with `status: "pending"`, return both IDs
3. Background task: LLM health check → PDF parse + clean → structured summary via `SummarySchema` → UPDATE paper → INSERT references → update job to `"storing"` → embed + vectorize → update job to `"done"` (or `"failed"` with error)

### GET `/api/jobs/[id]`

Response: `{ status, paperId, error }`. Auth check + ownership verify.

### POST `/api/chat`

Request: `{ paperId, messages: ChatMessage[] }`. Response: `{ text: "AI response" }`.

**Pipeline:**
Auth check → validate paperId → fetch paper (ownership) → LLM health check → `createRagAgent(paperId, { name, summary })` → invoke with full history → `vectorStore.end()` → return last message text.

### GET `/api/papers/[id]`

Response: `{ id, name, summaryData: SummaryData }`. Auth check + ownership verify + relational query with references.

### DELETE `/api/papers/[id]`

Response: 204 No Content.

**Pipeline:**
Auth → validate → ownership check → `vectorStore.delete({ filter: { paperId } })` → `db.delete(paper)` (cascades to references) → `vectorStore.end()`.

### GET+POST `/api/auth/[...all]`

Catch-all delegating to better-auth's `svelteKitHandler`. Passes `building` flag to skip auth during build time.

## Server Hook

`src/hooks.server.ts` — Delegates to `svelteKitHandler({ auth, event, resolve, building })`. Validates auth cookies and injects session context on every request.

## Responsive Layout

- **Desktop/Landscape**: Two-column flex (`28%` files, `72%` content).
- **Portrait Mobile**: Single-column toggle — show only the active panel.
