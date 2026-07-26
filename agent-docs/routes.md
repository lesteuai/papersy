# Routes & API

SvelteKit file-based routing. Full-stack SPA application with authenticated pages and REST API routes. There is no `+page.server.ts` anywhere in the app; every page fetches its own data client-side.

## Directory Structure

```
src/routes/
├── +layout.ts                          <- export const ssr = false
├── +layout.svelte                      <- Header + outlet, global styles
├── +page.svelte                        <- Project list, or LoginCard when logged out
├── verify-email/+page.svelte           <- Email verification page (unreachable through normal sign-in; verification is off)
├── forgot-password/+page.svelte        <- Forgot password form (send reset email)
├── reset-password/+page.svelte         <- Reset password form (verify token, set new password)
├── p/[projectId]/+layout.svelte        <- Project shell: session list, document list, two-column/mobile layout
├── p/[projectId]/+page.svelte          <- Empty state: "Select a chat, or start a new one"
├── p/[projectId]/c/[sessionId]/+page.svelte  <- The chat
│
└── api/
    ├── auth/[...all]/+server.ts                 <- GET/POST catch-all for better-auth
    ├── projects/+server.ts                       <- GET: list projects; POST: create
    ├── projects/[projectId]/+server.ts           <- PATCH: rename; DELETE: delete + cascade + cancel ingestions
    ├── projects/[projectId]/sessions/+server.ts  <- GET: list sessions with derived label; POST: create
    ├── projects/[projectId]/documents/+server.ts <- GET: list documents with status; POST: upload
    ├── sessions/[sessionId]/+server.ts           <- PATCH: rename; DELETE: delete
    ├── sessions/[sessionId]/messages/+server.ts  <- GET: message history
    ├── documents/[documentId]/+server.ts         <- DELETE: delete + cancel ingestion
    └── chat/+server.ts                            <- POST: persist turn, invoke agent, return answer

(src/hooks.server.ts at project root handles auth per-request)
```

The old `/api/upload`, `/api/papers/[id]` and `/api/jobs/[id]` routes are gone.

## Root Layout

### +layout.ts

`export const ssr = false` (SPA mode; pages rendered client-side).

### +layout.svelte

Renders `<Header />` and `<main>{@render children()}</main>`, imports `global.scss`.

## Root Page (`/`)

`+page.svelte` fetches `GET /api/projects` on mount (guarded by `$loggedIn`) and renders:

1. **Logged out** — `<LoginCard onLogin onSignUp />`
2. **Logged in** — `<ProjectList projects onCreate onSelect onRename onDelete />`

**State:**
```ts
let projects: Project[] = $state([]);
let apiError = $state<string | null>(null);
```

**Event Handlers:**

| Handler | What it does |
|---|---|
| `handleLogin(email, password)` | `getAuthClient()!.signIn.email(...)`, sets `loggedIn` |
| `handleSignUp(name, email, password)` | `getAuthClient()!.signUp.email(...)`; no verification step, so the user can log in immediately |
| `handleCreate(name)` | POST `/api/projects`, appends the returned project |
| `handleSelect(id)` | `goto(`/p/${id}`)` |
| `handleRename(id, name)` | PATCH `/api/projects/:id`, replaces the project in the list |
| `handleDelete(id)` | DELETE `/api/projects/:id`, removes it from the list |

## Project Layout (`/p/[projectId]`)

`p/[projectId]/+layout.svelte` fetches the project (via the `/api/projects` list, matched by id) and its sessions on mount, and redirects to `/` if either lookup 404s. Renders the two-column app shell: a side panel with Chats/Docs tabs (`SessionList` / `DocumentList`) and a content panel that renders the nested page (`{@render children()}`).

Exposes two values via Svelte context so nested pages can act on the session list without prop drilling:
- `refreshSessions` — re-fetches sessions (called after a session's first message gives it an auto-label)
- `createSession` — creates a session and navigates to it (called from the empty-state page)

**State:**
```ts
let project = $state<Project | null>(null);
let sessions = $state<Session[]>([]);
let activeTab: 'chats' | 'docs' = $state('chats');
let mobileActivePanel: 'sessions' | 'content' = $state('sessions');
```

### `/p/[projectId]` (empty state)

Reads `createSession` from context; shows "Select a chat, or start a new one" with a New Chat button.

### `/p/[projectId]/c/[sessionId]` (chat)

Fetches `GET /api/sessions/:id/messages` whenever `sessionId` changes. `handleSend(text)` optimistically appends a user message and a loading assistant message, POSTs to `/api/chat`, then replaces the loading message with the real reply (or an error message on failure). After the first message in a session, it calls the `refreshSessions` context function so the session list picks up its new auto-derived label.

## API Routes

Every handler below calls `requireSession` first and then verifies the row belongs to `session.user.id`, returning 404 (never 403) on a foreign or nonexistent id, so a foreign row's existence is never revealed.

### GET, POST `/api/projects`

GET: list the caller's projects, `{ id, name, createdAt }[]`.
POST: body `{ name }`, validated by `validateName` (trimmed, 1-100 chars); creates and returns the project.

### PATCH, DELETE `/api/projects/[projectId]`

PATCH: body `{ name }`, same validation; renames and returns the project.
DELETE: aborts and clears `activeIngestions` for every document in the project, then deletes the project row (cascades to sessions, messages, documents, chunks).

### GET, POST `/api/projects/[projectId]/sessions`

GET: for each session, derives `label` via `sessionLabel(name, firstUserMessage)` — the first user message is only looked up when `name` is null. Returns `{ id, projectId, name, label, createdAt }[]`.
POST: creates a session with `name: null`; returns it with `label` already derived (`"New chat"` until a first message exists).

### PATCH, DELETE `/api/sessions/[sessionId]`

PATCH: body `{ name }`, validated by `validateName`; writes `chatSession.name`, so an auto-label is never overwritten again once a user renames a session.
DELETE: deletes the session (cascades to its messages); the project's documents are untouched.

### GET `/api/sessions/[sessionId]/messages`

Returns the session's messages in creation order as `{ role, text }[]`.

### GET, POST `/api/projects/[projectId]/documents`

GET: returns `{ id, name, kind, status, error }[]` for the project.
POST: `FormData { file }`. Pipeline:
1. `extractDocument(buffer, file.name)` — 400 with a message naming the accepted types (`UnsupportedTypeError`) or naming it unreadable (`EmptyExtractionError`)
2. `checkCharLimit(extracted.text.length)` — 400 naming the actual count and the 45,000 limit if exceeded
3. Insert the `document` row with `status: 'pending'`
4. Register an `AbortController` in `activeIngestions` and kick off `ingestDocument(...)` in the background (not awaited)
5. Return `{ documentId }` immediately (202-style, though not literally a 202 status)

No document row, chunk, or file remnant is stored when either check fails.

### DELETE `/api/documents/[documentId]`

Aborts and clears any in-flight ingestion for the document, then deletes it (cascades to its chunks).

### POST `/api/chat`

Body `{ sessionId, text }`. Pipeline:
1. Verify the session belongs to the caller (404 otherwise)
2. `checkLlmHealth()` — 503 if unreachable
3. `checkEmbeddingHealth()` — 503 if unreachable
4. Load prior messages, then persist the new user message
5. Build LangChain message history (`HumanMessage`/`AIMessage`) from prior messages plus the new text
6. `createProjectAgent({ projectId, userId, projectName })`, `agent.invoke({ messages: history })`
7. Persist the assistant reply, return `{ text }`

No streaming: the full answer is returned in one response.

### GET+POST `/api/auth/[...all]`

Catch-all delegating to better-auth's `svelteKitHandler`. Passes `building` flag to skip auth during build time.

## Server Hook

`src/hooks.server.ts` — Delegates to `svelteKitHandler({ auth, event, resolve, building })`. Validates auth cookies and injects session context on every request.

## Responsive Layout

- **Desktop/Landscape**: Two-column flex (`28%` side panel, `72%` content).
- **Portrait Mobile**: Single-column toggle — show only the active panel (`sessions` or `content`).
