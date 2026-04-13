# Plan: Papersy Feature Fixes and Improvements

## Overview
Implement a set of bug fixes and UX improvements across the Papersy app, covering chat behavior, UI polish, upload state persistence, LLM health checks, and navigation fixes.

## Tasks

### Task 1: Animated AI thinking ellipsis
**Status**: pending
**Goal**: When the AI is computing a response, animate the "..." placeholder message to visually indicate thinking.
**Files likely involved**:
- `src/lib/components/dedicated/app/types.ts` — add `loading?: boolean` to `ChatMessage`
- `src/lib/components/dedicated/app/ChatMessage.svelte` — render animated dots when `message.loading` is true
- `src/routes/+page.svelte` — set `loading: true` on the placeholder AI message in `handleSend`
**Depends on**: none
**Details**:
- Add `loading?: boolean` to the `ChatMessage` type.
- In `ChatMessage.svelte`, when `message.loading` is true, render an animated three-dot element instead of the message text. Use CSS `@keyframes` to animate each dot with a sequential bounce or fade effect.
- In `+page.svelte` `handleSend`, change `{ role: 'ai', text: '...' }` to `{ role: 'ai', text: '', loading: true }`.
- On receiving the response, replace the loading message with `{ role: 'ai', text: data.text }` (loading becomes undefined/false).

---

### Task 2: README debugger instructions
**Status**: pending
**Goal**: Add a note to `README.md` about debugging with VS Code by adding the `debugger` statement to API TypeScript files.
**Files likely involved**:
- `README.md`
**Depends on**: none
**Details**:
- Add a short section or line in the Command Reference or a new "Debugging" subsection explaining: launch the VS Code debugger using the included launch configuration, and add `debugger` statements to API `.ts` files (in `src/routes/api/`) to set breakpoints.

---

### Task 3: Fix chat input mode switch behavior
**Status**: pending
**Goal**: (1) Remove the immediate chat-mode switch when the user types in the chat input. Mode should only switch when the message is sent. (2) Disable the chat input and mode tabs while the selected paper is still being processed.
**Files likely involved**:
- `src/lib/components/dedicated/app/ContentPanel.svelte` — remove `oninput` handler from `ChatInput`, accept `disabled` prop
- `src/lib/components/dedicated/app/ChatInput.svelte` — accept and apply `disabled` prop
- `src/routes/+page.svelte` — pass `disabled` to `ContentPanel` based on `jobsInProgress`
**Depends on**: none
**Details**:
- In `ContentPanel.svelte`, remove `oninput={() => onModeChange('chat')}` from the `<ChatInput>` usage. Mode switching on input is unwanted.
- Add a `disabled?: boolean` prop to `ContentPanel`. When `disabled` is true: disable the `<ChatInput>` (pass `disabled` to it) and disable both tab buttons (add `disabled` attribute and muted styling).
- In `ChatInput.svelte`, add `disabled?: boolean` prop and apply `disabled` to the `<textarea>` and send button, with appropriate visual styling (opacity, cursor).
- In `+page.svelte`, compute `isProcessing`: the selected file has a pending/processing job in `jobsInProgress`. Pass `disabled={isProcessing}` to `ContentPanel`.

---

### Task 4: Fix second question chat bug
**Status**: pending
**Goal**: Fix the bug where chat stops answering after the first question.
**Files likely involved**:
- `src/routes/+page.svelte` — fix message array update pattern
**Depends on**: none
**Details**:
- In `+page.svelte` `handleSend`, the line `messages[messages.length - 1] = { role: 'ai', text: data.text }` mutates by index. Replace with a spread: `messages = [...messages.slice(0, -1), { role: 'ai', text: data.text }]` for reliable Svelte 5 reactivity.
- If `messages.loading` was added in Task 1, ensure the loading message (with `loading: true`) is excluded from the history sent to the server (already handled by `messages.slice(0, -1)`).

---

### Task 5: Fix back button navigation
**Status**: pending
**Goal**: Fix two bugs: (1) after pressing back and reselecting a file, the chat/summary mode switch is broken; (2) after pressing back twice, can't navigate back into the highlighted file.
**Files likely involved**:
- `src/routes/+page.svelte`
**Depends on**: none
**Details**:
- Root cause: `mode` and `messages` are not reset when navigating away from a file. Fix: in `handleBack`, reset `mode = 'summary'` and `messages = []`.
- Also reset on file selection: in `handleSelect`, reset `mode = 'summary'` and `messages = []` when the selected file changes (i.e., `id !== selectedFileId`).
- For the "can't get back into the highlighted file" bug on mobile: after pressing back (ContentPanel back button sets `mobileActivePanel = 'files'`), the file remains selected but the content panel is hidden. Clicking the highlighted file calls `handleSelect(id)` with the same `id`. Since `selectedFileId === id` already, Svelte 5 may not trigger reactivity on `selectedFileId` assignment. Fix: always set `mobileActivePanel = 'content'` in `handleSelect` regardless of whether the ID changed.

---

### Task 6: LLM health check
**Status**: pending
**Goal**: Add a health check against the LLM endpoint. If the LLM is unreachable or times out, return an error response immediately rather than hanging.
**Files likely involved**:
- `src/lib/server/llm.ts` — add `checkLlmHealth()` function
- `src/routes/api/chat/+server.ts` — check health before invoking agent
- `src/routes/api/upload/+server.ts` — check health before starting background processing
**Depends on**: none
**Details**:
- In `llm.ts`, add `async function checkLlmHealth(): Promise<boolean>`. Use a short `AbortSignal.timeout(5000)` fetch to `${env.CHAT_MODEL_URL}/models` (standard OpenAI-compatible health endpoint). Return `true` if response is OK, `false` on any error or timeout.
- Export `checkLlmHealth` from `llm.ts`.
- In `api/chat/+server.ts`: before creating the RAG agent, call `checkLlmHealth()`. If it returns false, return `error(503, 'LLM service unavailable')`.
- In `api/upload/+server.ts`: inside `processUpload`, at the start before any LLM call, check health. If unhealthy, update job status to `'failed'` with error message `'LLM service unavailable'` and return early.

---

### Task 7: Persist upload jobs across page refresh and add progress indicator
**Status**: pending
**Goal**: (1) When uploading, create the paper row immediately (empty) so the file can be deleted while processing and survives page refresh. (2) Show a progress indicator on in-progress files in the file list.
**Files likely involved**:
- `src/lib/server/db/schema.ts` — no schema change needed if paper is created immediately
- `src/routes/api/upload/+server.ts` — create paper first, then job linked to paper
- `src/routes/+page.server.ts` — load both completed papers and in-progress jobs
- `src/lib/components/dedicated/app/types.ts` — add `jobId?: string; jobStatus?: string` to `PapersyFile`
- `src/lib/components/dedicated/app/FileListItem.svelte` — show spinner when `file.jobStatus` is pending/processing
- `src/lib/components/dedicated/app/FilePanel.svelte` — pass job status info through
- `src/routes/+page.svelte` — use real paperId from server response, hydrate jobsInProgress on mount
**Depends on**: Task 6 (api/upload is also modified there; apply changes together)
**Details**:

**api/upload changes:**
- Generate `paperId` before creating the job.
- Insert an empty paper row first: `{ id: paperId, userId, name: file.name }` (summary fields are nullable, so this is valid).
- Insert the job with `paperId` set: `{ id: jobId, userId, status: 'pending', paperId }`.
- In `processUpload`: instead of `db.insert(paper)`, use `db.update(paper).set({ summary, keyFindings, methodology, limitations }).where(eq(paper.id, paperId))`. Remove the paperId from the job update at completion (it's already set); just update status to `'done'`.
- Return `{ jobId, paperId }` from the POST handler.

**+page.server.ts changes:**
- Also query `job` table for this user where status is `'pending'` or `'processing'`, joining with paper to get the paper name.
- For jobs that have a `paperId`, include the paper in the returned `papers` list with `jobId` and `jobStatus` fields.
- Use a left join or separate query: get all papers, then get all active jobs for those papers.

**types.ts changes:**
- Add `jobId?: string` and `jobStatus?: string` to `PapersyFile`.

**+page.svelte changes:**
- On mount, for any paper from server that has `jobId` and `jobStatus` of `'pending'`/`'processing'`, add to `jobsInProgress` and call `pollJobStatus(paper.id, paper.jobId)`.
- In `handleUpload`, use the returned `paperId` from server as the real ID (instead of `crypto.randomUUID()`). Add the paper to files with `{ id: paperId, name: file.name, jobId, jobStatus: 'pending' }`.
- In `pollJobStatus`, when job is done, update the paper's summaryData and clear `jobId`/`jobStatus` from the file. When job fails, update the file name to indicate failure and clear job tracking.
- In `handleDelete`, if the file has a `jobId`, remove it from `jobsInProgress` to stop polling.

**FileListItem.svelte changes:**
- When `file.jobStatus` is `'pending'` or `'processing'`, show a small CSS spinner (animated circle) next to the file name to indicate processing.
- When `file.jobStatus` is `'failed'` or the name includes `(Failed)`, show an error indicator.
- Disable the delete button or allow it (deletion of in-progress paper is OK since the paper row exists).

**FilePanel.svelte changes:**
- No changes needed; `FileListItem` receives the full `file` object including `jobStatus`.
