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
    ├── upload/+server.ts         ← POST: submit PDF, return jobId (async)
    ├── jobs/[id]/+server.ts      ← GET: poll job status
    ├── chat/+server.ts           ← POST: RAG agent with history
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
- If session: calls an API endpoint to fetch papers and their references, returns as `PapersyFile[]` with populated `summaryData`

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
onMount(() => { if (data.loggedIn) loggedIn.set(true); });

let files = $state(data.papers ?? []);          // PapersyFile[]
let selectedFileId = $state(null);
let selectedFile = $derived(files.find(f => f.id === selectedFileId));
let mode = $state('summary');                   // 'summary' | 'chat'
let messages = $state([]);                      // ChatMessage[]
let uploading = $state(false);
let mobileActivePanel = $state('files');        // 'files' | 'content'
```

**Event handlers:**

| Handler | What it does |
|---|---|
| `handleLogin(email, password)` | `getAuthClient()!.signIn.email(...)`, sets loggedIn |
| `handleUpload(file)` | POST `/api/upload`, receives jobId, polls `/api/jobs/:id`, appends paper when done |
| `handleSelect(id)` | sets selectedFileId, switches mobile panel |
| `handleDelete(id)` | DELETE `/api/papers/:id`, removes from files (checks response status) |
| `handleSend(text)` | POST `/api/chat` with history, appends AI reply |
| `handleBack()` | toggles mobile panel to files |

---

## API Routes

### POST `/api/upload`

**Request:** `FormData { file: File }` (PDF only)

**Response (202 Accepted):**
```json
{ "jobId": "uuid" }
```

**Pipeline:**
1. Auth check (401 if no session)
2. Validate PDF (400 if not PDF)
3. Create `job` row with `status: "pending"`, return `jobId` immediately (202)
4. **Background task** (async, no await):
   - Update job to `status: "processing"`
   - `new PDFParse({ data: buffer }).getText()` → extract text (pdf-parse v2.x class API)
   - `ChatOpenAI.withStructuredOutput(SummarySchema)` → structured summary
   - Insert `paper` row (userId FK)
   - Insert `reference` rows (one per reference)
   - Split text (1000 chars / 200 overlap) → embed → insert into `documents` with `{ paperId }` metadata
   - Update job to `status: "done"` with `paperId`, or `status: "failed"` with error message

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
3. `createRagAgent(paperId)` — retrieve tool filtered by paperId metadata
4. Map messages to LangChain `HumanMessage`/`AIMessage`
5. `agent.invoke({ messages: [systemPrompt, ...history] })`
6. `vectorStore.end()`
7. Return last message text

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
