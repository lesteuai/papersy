# Implementation Plan

## Standing Rule
After every commit's coding is finished, update all relevant `CLAUDE.md` files in the folder and subfolders to reflect any architectural or structural changes, and update the root `AGENTS.md` file accordingly.

---

## Commit 1 — Fix N+1 query
**Files:** `src/routes/+page.server.ts`, `src/routes/api/papers/[id]/+server.ts`

Replace two-stage `db.select()` (papers + per-paper references loop) with a single `db.query()` using Drizzle's relational API.

---

## Commit 2 — Add `building` guard in auth handler and hooks
**Files:** `src/routes/api/auth/[...all]/+server.ts`, `src/hooks.server.ts`

Import `building` from `$app/environment` and pass it to `svelteKitHandler` so auth is skipped during build time.

---

## Commit 3 — Add `if (!res.ok)` guard in `handleDelete()`
**Files:** `src/routes/+page.svelte`

Add an early return (or error display) on non-2xx responses in `handleDelete()`.

---

## Commit 4 — Move system prompt into agent
**Files:** `src/lib/server/llm.ts`

Pass the system prompt directly as a message to the agent constructor instead of injecting it separately at invocation.

---

## Commit 5a — Add `job` table to Drizzle schema
**Files:** `src/lib/server/db/schema.ts` (or equivalent)

New table columns: `id`, `userId`, `status` (`pending | processing | done | failed`), `paperId` (nullable FK), `error` (nullable), `createdAt`. Run migration.

---

## Commit 5b — Refactor upload to background task
**Files:** `src/routes/api/upload/+server.ts`

Insert a `job` row with `status: "pending"`, respond immediately with `{ jobId }`, then run the PDF/summarize/embed pipeline as a background Promise (no await on response). Update job to `processing` -> `done`/`failed` as it progresses.

---

## Commit 5c — Add job status polling endpoint
**Files:** `src/routes/api/jobs/[id]/+server.ts` (new)

Auth-gated GET endpoint. Returns `{ status, paperId, error }` for the given job ID.

---

## Commit 6a — Add processing placeholder card to file list
**Files:** `src/routes/+page.svelte`

When upload starts, push a placeholder card into the papers list showing "Processing..." with a spinner. Static visual state driven by local `$state` — no polling yet.

---

## Commit 6b — Wire up job polling
**Files:** `src/routes/+page.svelte`

After upload returns `jobId`, poll `api/jobs/[id]` on an interval. On `done`, fetch the paper using the returned `paperId`, replace the placeholder card with the real paper, auto-select it, and open the summary tab.

---

## Commit 6c — Handle job failure in UI
**Files:** `src/routes/+page.svelte`

If poll returns `status: "failed"`, replace the placeholder card with an error state (red indicator + error message). Add a dismiss action.

---

## Commit 7 — Chat mode: only enter on send
**Files:** `src/routes/+page.svelte`

Only switch to chat mode after the user submits a message (Enter or send button click), not on focus or mount.

---

## Commit 8 — Add ellipsis waiting indicator for AI response
**Files:** `src/routes/+page.svelte`

Show a loading indicator (animated `...` message bubble) between sending a chat message and receiving the AI response.

---

## Commit 9 — Add email verification and password reset flows
**Files:** auth config, new route pages/components

Wire up better-auth's `emailVerification` and `forgotPassword`/`resetPassword` endpoints. Add corresponding UI: verify email prompt, forgot password form, reset password form.

---

## Commit 10 — Cap sign-ups at 100 users
**Files:** auth hook or sign-up handler

Query user count before allowing sign-up. Return 403 (or redirect with error) if count >= 100.
