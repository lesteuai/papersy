# src/routes

SvelteKit file-based routing. Full-stack SPA application with authenticated pages and REST API routes.

---

## Route structure

```
src/routes/
├── +layout.ts                    ← export const ssr = false
├── +layout.svelte                ← Header + outlet, global styles
├── +page.server.ts               ← load(): fetch user's papers from DB
├── +page.svelte                  ← App shell: Login page or File+Content panels
├── verify-email/+page.svelte     ← Email verification page (token-based)
├── forgot-password/+page.svelte  ← Forgot password form (send reset email)
├── reset-password/+page.svelte   ← Reset password form (verify token, set new password)
│
└── api/
    ├── auth/[...all]/+server.ts  ← GET/POST catch-all for better-auth
    ├── upload/+server.ts         ← POST: submit PDF, return { jobId, paperId } (async)
    ├── jobs/[id]/+server.ts      ← GET: poll job status
    ├── chat/+server.ts           ← POST: RAG agent, passes only last message
    └── papers/[id]/+server.ts    ← GET: fetch paper; DELETE: paper + cascading cleanup

(src/hooks.server.ts at project root handles auth per-request)
```

---

## Root layout

**`+layout.ts`** — `export const ssr = false`
- SPA mode enabled; pages rendered client-side after initial hydration

**`+layout.svelte`**
- Renders `<Header />` and `<main>{@render children()}</main>`
- Imports `global.scss`

---

## Root page (`/`)

**`+page.server.ts`** — `load()` function (SPA mode)

In SPA mode, `load()` runs on the client and returns `{ papers: PapersyFile[], loggedIn: boolean }` to `+page.svelte`.

- Calls API endpoints to fetch data (since database is not directly accessible client-side)
- Checks session status via API
- If no session: `{ papers: [], loggedIn: false }`
- If session: fetches all papers with references, then queries active jobs (pending/processing) for this user; returns `PapersyFile[]` with `jobId` and `jobStatus` populated for papers that are still processing

**`+page.svelte`** — App shell

**Logical states:**

1. **Auth** — when `!$loggedIn`
   - Centered `<LoginCard />` with toggle between sign in and sign up
   - Sign In: `onLogin: (email, password) => Promise<string | null>` — calls `getAuthClient()!.signIn.email(...)`, sets `loggedIn.set(true)` on success
   - Sign Up: `onSignUp: (name, email, password) => Promise<string | null>` — calls `getAuthClient()!.signUp.email(...)`, user receives verification email (email verification required)
   - Links to `/forgot-password` for password reset

2. **File Manager + Summary** — `$loggedIn`, file selected
   - Left: `<FilePanel />` — Upload, file list, delete menus
   - Right: `<ContentPanel mode="summary" />` — summary, findings, methodology, limitations, references

3. **File Manager + Chat** — `$loggedIn`, chat mode active
   - Same layout; right panel shows chat history + input

**State:**

```ts
let { data } = $props();                        // from +page.server.ts
onMount(() => {
  if (data.loggedIn) loggedIn.set(true);
  if (data.papers) {
    files = data.papers;
    // Resume polling for any in-progress jobs loaded from server
    for (const p of data.papers) {
      if (p.jobId && (p.jobStatus === 'pending' || p.jobStatus === 'processing')) {
        jobsInProgress[p.id] = { jobId: p.jobId, status: p.jobStatus };
        pollJobStatus(p.id, p.jobId);
      }
    }
  }
});

let files: PapersyFile[] = $state([]);          // includes jobId/jobStatus for in-progress papers
let selectedFileId = $state(null);
let selectedFile = $derived(files.find(f => f.id === selectedFileId));
let jobsInProgress = $state({});               // Record<paperId, { jobId, status, error? }>
let isProcessing = $derived(...);              // true if selectedFile has active job
let mode = $state('summary');                   // 'summary' | 'chat'
let messages = $state([]);                      // ChatMessage[] — includes loading?: boolean
let uploading = $state(false);
let mobileActivePanel = $state('files');        // 'files' | 'content'
```

**Event handlers:**

| Handler | What it does |
|---|---|
| `handleLogin(email, password)` | `getAuthClient()!.signIn.email(...)`, sets loggedIn |
| `handleUpload(file)` | POST `/api/upload`, receives `{ jobId, paperId }`, adds paper with `jobStatus: 'pending'`, starts polling |
| `handleSelect(id)` | Sets selectedFileId; resets mode+messages when switching files; sets `mobileActivePanel = 'content'` always |
| `handleDelete(id)` | DELETE `/api/papers/:id`, removes from files, stops polling for that job |
| `handleSend(text)` | Adds user message + AI loading message, POST `/api/chat`, replaces loading with response |
| `handleBack()` | Resets mode+messages, toggles mobile panel to files (or clears selectedFileId on desktop) |

---

## API Routes

### POST `/api/upload`

**Request:** `FormData { file: File }` (PDF only)

**Response (202 Accepted):**
```json
{ "jobId": "uuid", "paperId": "uuid" }
```

**Pipeline:**
1. Auth check (401 if no session)
2. Validate PDF (400 if not PDF)
3. Create empty `paper` row (name + userId only, no summary yet)
4. Create `job` row with `status: "pending"` linked to `paperId`; return both IDs immediately
5. **Background task** (async, no await):
   - LLM health check — marks job failed immediately if LLM unreachable
   - `new PDFParse({ data: buffer }).getText()` → extract text (pdf-parse v2.x class API)
   - Clean page markers (`-- N of M --`) from extracted text
   - **Small PDFs** (text < 60,000 chars): `ChatOpenAI.withStructuredOutput(SummarySchema)` → structured summary directly
   - **Large PDFs** (text >= 60,000 chars): map-reduce -- split into 12,000-char chunks, summarize each chunk via plain-text LLM call using `default-prompts/chunk-summarize.txt`, concatenate results, then run `SummarySchema` structured output on combined summaries
   - UPDATE `paper` row with summary data (does not insert a new row)
   - Insert `reference` rows (one per reference)
   - Split text (1000 chars / 200 overlap) → embed → insert into `documents` with `{ paperId }` metadata
   - Update job to `status: "done"`, or `status: "failed"` with error message stored in `job.error`

---

### GET `/api/jobs/[id]`

**Response (200):**
```json
{
  "status": "pending|processing|done|failed",
  "paperId": "uuid|null",
  "error": "error message|null"
}
```

**Pipeline:**
1. Auth check (401 if no session)
2. Verify job belongs to user (404 if not found)
3. Return job status, paperId (when done), and error message (if failed)

---

### POST `/api/chat`

**Request:**
```json
{ "paperId": "uuid", "messages": [{ "role": "user"|"ai", "text": "..." }] }
```

**Response (200):** `{ "text": "AI response" }`

**Pipeline:**
1. Auth check (401)
2. Validate paperId (400)
3. LLM health check — 503 if unavailable
4. `createRagAgent(paperId)` — retrieve tool filtered by paperId metadata
5. Map messages to LangChain `HumanMessage`/`AIMessage`
6. `agent.invoke({ messages: [history.at(-1)!] })` — passes only the last user message
7. `vectorStore.end()`
8. Return last message text from result

---

### GET `/api/papers/[id]`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "filename.pdf",
  "summaryData": {
    "summary": "...",
    "keyFindings": ["...", "..."],
    "methodology": "...",
    "limitations": "...",
    "references": ["..."]
  }
}
```

**Pipeline:**
1. Auth check (401)
2. Verify ownership via relational query (404 if not found)
3. Fetch paper with references using `db.query.paper.findFirst()`
4. Return paper JSON

---

### DELETE `/api/papers/[id]`

**Response:** 204 No Content

**Pipeline:**
1. Auth check (401)
2. Verify ownership via relational query (`db.query.paper.findFirst()`) (404 if not found)
3. `vectorStore.delete({ filter: { paperId: id } })`
4. `db.delete(paper).where(eq(paper.id, id))` — cascades to `reference` rows
5. `vectorStore.end()`
6. Return 204

---

### GET+POST `/api/auth/[...all]`

Catch-all delegating to better-auth's `svelteKitHandler`. Handles all auth sub-routes:
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- etc.

Passes `building` flag from `$app/environment` to skip auth handling during build time.

---

## Server Hook

**`src/hooks.server.ts`**

```ts
export const handle = ({ event, resolve }) =>
  svelteKitHandler({ auth, event, resolve, building });
```

Runs on every request (except during build time). Validates auth cookies, injects session context. Passes `building` flag to skip auth during build.

---

## Responsive Layout

**Desktop/Landscape:** Two-column flex (`28%` files, `72%` content)

**Portrait Mobile:** Single-column toggle — show only the active panel

---

## Maintenance

Update this file when adding routes, changing API contracts, or modifying the page state model.
