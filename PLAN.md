# Plan: Upload error feedback and large PDF handling

## Overview
Two improvements: surface upload failure errors to the user in the Summary tab with Chat locked on failed papers, and implement map-reduce summarization so PDFs exceeding the LLM context window are handled gracefully.

## Tasks

### Task 1: Show upload error in Summary tab and lock Chat for failed papers
**Status**: done
**Goal**: When a background upload job fails, display the error reason in the Summary tab and disable the Chat tab for that paper.
**Depends on**: none
**Details**:
- Add `uploadError?: string` to the `PapersyFile` type in `src/lib/utils/types.ts`
- In `src/routes/+page.svelte` `pollJobStatus()`, when `jobData.status === 'failed'`, update the file entry to include `jobStatus: 'failed'` and `uploadError: jobData.error ?? 'Unknown error'` (and keep `jobId: undefined`). Currently the code sets both to `undefined` and discards the error. Do not `delete jobsInProgress[paperId]` before storing the error on the file.
- In `+page.svelte`, derive a separate `isFailed` boolean: `selectedFile?.jobStatus === 'failed'`. Pass it as a new prop `uploadError` (the string) to `ContentPanel`.
- Update `ContentPanel.svelte` to accept `uploadError?: string`. When `uploadError` is present: keep the Summary tab enabled (error shows there), but disable only the Chat tab. The existing `disabled` prop (for processing state) still disables both tabs. Pass `uploadError` down to `SummaryView`.
- Update `SummaryView.svelte` to accept `error?: string`. When `error` is set, replace the normal `{:else}` placeholder with an error state showing the failure reason (e.g. "Upload failed: <reason>").
- Also update `src/lib/components/CLAUDE.md` props tables to reflect the new props on `ContentPanel` and `SummaryView`.

### Task 2: Map-reduce summarization for large PDFs
**Status**: done
**Goal**: When a PDF's extracted text exceeds a size threshold, split it into chunks, summarize each chunk as plain text, then run the structured output extraction on the combined chunk summaries -- so the LLM never receives more than one chunk at a time.
**Depends on**: none
**Details**:
- All changes are in `src/routes/api/upload/+server.ts`.
- Define a constant `SUMMARIZE_CHUNK_THRESHOLD = 60000` (characters). Papers under this limit go through the existing single-pass structured output chain. Papers at or above it go through the map-reduce path.
- Map-reduce path:
  1. Use `RecursiveCharacterTextSplitter` with `chunkSize: 12000, chunkOverlap: 500` to split `paperText` into chunks.
  2. For each chunk, call the LLM with a simple string output (no structured output) using a short inline system prompt: "Summarize the key points of this section of a research paper in a few paragraphs." Use `getLlm()` and a `ChatPromptTemplate` with `['system', chunkSystemPrompt], ['human', '{chunk}']`. Collect all chunk summaries.
  3. Concatenate the chunk summaries into a single `combinedSummary` string.
  4. Run the existing `SummarySchema` structured output chain on `combinedSummary` instead of `paperText`.
- The rest of the pipeline (DB updates, references, vectorization) is unchanged.
- Add `throwIfAborted(signal)` checks between chunk LLM calls so cancellation still works.
- Create `default-prompts/chunk-summarize.txt` with the chunk summarization system prompt (read with `fs.readFile` at module load time, same pattern as `PROMPT_PATH`).
