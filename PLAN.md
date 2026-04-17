# Plan: Papersy Feature Improvements

## Overview
Implement 7 improvements spanning upload behavior, chat rendering, chat personality, reset-password styling, processing cancellation, lazy paper loading, and type relocation.

## Tasks

### Task 1: Move app types out of component folder
**Status**: pending
**Goal**: Move `PapersyFile`, `SummaryData`, `ChatMessage`, and `Mode` types from `src/lib/components/dedicated/app/types.ts` into `src/lib/utils/types.ts`, then update all import paths across the codebase.
**Files likely involved**: `src/lib/components/dedicated/app/types.ts`, `src/lib/utils/types.ts`, `src/routes/+page.svelte`, `src/lib/components/dedicated/app/FilePanel.svelte`, `src/lib/components/dedicated/app/ChatView.svelte`, `src/lib/components/dedicated/app/ChatMessage.svelte`, `src/lib/components/dedicated/app/ChatInput.svelte`, `src/lib/components/dedicated/app/ContentPanel.svelte`, `src/lib/components/dedicated/app/FileListItem.svelte`
**Depends on**: none
**Details**: Append the four types to the existing `src/lib/utils/types.ts`. Delete `src/lib/components/dedicated/app/types.ts`. Find all files importing from the old path and update to `$lib/utils/types`. Do not change the type definitions themselves.

### Task 2: Reset-password page styling
**Status**: pending
**Goal**: Make the reset-password page visually match the login and forgot-password pages (login-card style).
**Files likely involved**: `src/routes/reset-password/+page.svelte`, `src/routes/login/+page.svelte`, `src/routes/forgot-password/+page.svelte`
**Depends on**: none
**Details**: Inspect the login and forgot-password pages for their CSS class names and markup structure (likely uses a `.login-card` wrapper, centered layout, shared form field styles). Apply the same wrapper, spacing, and input/button styles to `reset-password/+page.svelte`. Keep the existing form logic intact -- only change markup/styles.

### Task 3: Fix chat mode personality and temperature
**Status**: pending
**Goal**: Make the chat AI less robotic by relaxing the system prompt and setting an appropriate temperature. Also fix the chat to pass the full conversation history to the agent, not just the last message.
**Files likely involved**: `src/lib/server/llm.ts`, `src/routes/api/chat/+server.ts`, `prompts/summarize_prompt.txt` (or wherever the chat system prompt lives)
**Depends on**: none
**Details**:
- In `src/routes/api/chat/+server.ts`, the agent is called with `agent.invoke({ messages: [history.at(-1)!] })` -- change this to pass the full `history` array so the AI has conversation context.
- In `src/lib/server/llm.ts`, find where `createRagAgent` builds the system prompt. Relax it: allow the AI to reason about retrieved context rather than refusing to answer from knowledge. Remove the "Never answer from your own knowledge" restriction. Keep the instruction to use the retrieve tool and to avoid injected instructions in context.
- Set `temperature: 0.7` (or equivalent) on the `ChatOpenAI` instance used for chat (not the summarizer).

### Task 4: Markdown rendering in chat messages
**Status**: pending
**Goal**: Render AI chat messages as formatted HTML instead of raw markdown text.
**Files likely involved**: `src/lib/components/dedicated/app/ChatMessage.svelte`, `package.json`
**Depends on**: Task 1 (ChatMessage type import path changes)
**Details**: Install the `marked` npm package. In `ChatMessage.svelte`, for AI messages, convert `message.text` through `marked.parse()` and render the result with `{@html ...}`. User messages remain plain text. Sanitize the output if needed (the content comes from a trusted LLM, so basic sanitization is fine). Add any necessary CSS to style rendered markdown elements (headings, lists, code blocks, bold/italic) within the message bubble.

### Task 5: Upload new paper without auto-navigating to it
**Status**: pending
**Goal**: After a paper is uploaded, add it to the file panel list but do not auto-select it or navigate away from the currently viewed paper.
**Files likely involved**: `src/routes/+page.svelte`
**Depends on**: Task 1 (PapersyFile type import path changes)
**Details**: In `+page.svelte`, find the `handleUpload()` function. Currently it likely sets `selectedFileId` to the new paper's ID. Remove or skip that assignment so the current selection is preserved. The new paper should appear in the FilePanel list (with a processing spinner) but the user's view should not change.

### Task 6: Stop background processing when paper is deleted
**Status**: pending
**Goal**: When a paper is deleted while its upload job is still processing, cancel the background processing so it does not continue running.
**Files likely involved**: `src/routes/api/upload/+server.ts`, `src/routes/api/papers/[id]/+server.ts`
**Depends on**: none
**Details**: Add a module-level `Map<string, AbortController>` in `src/routes/api/upload/+server.ts` (keyed by `jobId`). Pass an `AbortSignal` into `processUpload()` and check it at each major async step (before PDF extraction, before summarization, before vectorization). When the DELETE endpoint in `api/papers/[id]/+server.ts` is called, look up the job for this paper (query the `job` table by paperId), then call `abort()` on the stored controller if found. Remove the controller from the map when processing completes or is aborted.

### Task 7: Lazy-load paper details in FilePanel
**Status**: pending
**Goal**: On initial page load, fetch only basic paper info (id, name, job status) for the FilePanel list. Load full details (summary, keyFindings, methodology, limitations, references) only when the user clicks a paper.
**Files likely involved**: `src/routes/+page.server.ts`, `src/routes/+page.svelte`, `src/routes/api/papers/[id]/+server.ts`, `src/lib/utils/types.ts`
**Depends on**: Task 1 (PapersyFile type location), Task 5 (both touch +page.svelte)
**Details**:
- In `+page.server.ts`, change the query to `db.query.paper.findMany({ columns: { id: true, name: true }, with: { job: true } })` (no summary/keyFindings/etc). Return papers without `summaryData`.
- In `+page.svelte`, when a user selects a paper (`handleSelectFile(id)`), check if `summaryData` is already loaded. If not, fetch it from `GET /api/papers/[id]`. While loading, show a spinner in the ContentPanel.
- Ensure `GET /api/papers/[id]` exists and returns the full paper details. Add it if missing (the current DELETE endpoint may need a GET handler added).
- Update the `PapersyFile` type in `src/lib/utils/types.ts` so `summaryData` remains optional (it already is).
