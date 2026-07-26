# Spec: Human-Agent Workplace

Status: approved
Request: read @tasks.txt

```
I want to pivot Papersy into a sort of human - agent workplace. Let's say it looks like a chatbot with different projects, like in Claude Projects' workspace:
- For each project, the user can have multiple chat sessions which shares long term memory. This "long term memory" is a knowledge base, consisting of PDF, markdown and other documents, in which the AI agent can reference to ground its knowledge in actual document's content and source name, preventing it from using its own data and causing hallucinations. If the data doesn't exists in the bank, the AI agent just says it doesn't know and suggest the user to Google Search with a specific query. From these data in the base, AI agent can work with the user to infer, reason a problem more quickly, correctly.
- Limit the PDF or markdown upload to 10 pages per document (or 45000 characters).
- Change PDF content extraction library to @opendataloader/pdf. Check https://www.npmjs.com/package/@opendataloader/pdf
- Implement hybrid search (tsvector for full text + vector for semantic search) on Postgres/pgvector. Currently, it only has semantic search in the schema. Then use RRF to re-rank and produce 5 best results.
- You have access to a test database, openrouter key and REASONING_MODEL (for chatbot) and EMBEDDING_MODEL (for vector embedding) all set, in addition to playwright mcp for testing. Write unit and e2e tests.
```

## Overview

Papersy today is a flat list of research papers per user, where each paper gets an LLM summary and its own isolated RAG chat. This pivots it into a project workspace: a user owns projects, each project holds many chat sessions and one shared knowledge base of uploaded documents. Every session in a project retrieves from that same knowledge base, so the agent's grounding persists across conversations while the conversations stay separate. The agent answers only from retrieved document content and names its sources; when the knowledge base does not cover a question it says so and hands the user a specific Google query instead of inventing an answer.

## User Stories

- As a user, I want to group my work into projects, so that documents and conversations about one topic stay separate from another.
- As a user, I want to name a project when I create it and rename it later, so that its label keeps up with what the work turned into.
- As a user, I want several chat sessions inside a project, so that I can explore different threads without one conversation polluting another.
- As a user, I want to rename a chat session, including one the app named from my first message, so that I can find the thread again later.
- As a user, I want every session in a project to read the same uploaded documents, so that I do not re-upload the same material for each new conversation.
- As a user, I want the agent to answer from my documents and name the source, so that I can check any claim it makes.
- As a user, I want the agent to admit when my documents do not cover a question and suggest a Google search, so that I never act on an invented answer.
- As a user, I want to upload PDF, Markdown and plain text files, so that my knowledge base is not limited to research PDFs.
- As a user, I want oversized documents rejected with a clear reason, so that I know why an upload did not land.
- As a developer, I want to sign up and log in without an email round trip, so that I can test the app and run e2e against a real browser.
- As a developer, I want the OpenRouter credit lookup written down, so that I can check remaining budget before running a suite that costs tokens.
- As a user, I want a question containing an exact term from a document to find that document, so that retrieval does not fail on rare names, identifiers or misspellings that semantic similarity misses.

## Scope of the Pivot

The paper summarization feature is removed: no LLM summary, key findings, methodology, limitations or extracted references, and no summary UI. A document is a knowledge base source only. The `paper` and `reference` tables and the old vector table are dropped in a clean-break migration; the new workspace tables are created empty. In practice the configured database currently holds no tables at all, so nothing of value is lost. Authentication, theming and the component system are unchanged.

### Accepted tradeoff on PDF extraction

`markitdown-ts@0.0.10` delegates PDF handling to `pdf-parse` and returns its `getText()` output verbatim (`PdfConverter._convert`), which is what the current upload route already calls. Choosing it therefore leaves PDF extraction quality unchanged and keeps `pdf-parse` in the dependency tree transitively; what it buys is a single extraction API across `.pdf`, `.md` and `.txt`, and a path to more formats later. Improving extraction quality is explicitly not a goal of this spec. It also pulls `jsdom`, `xlsx`, `mammoth`, `ai` and `turndown` transitively, and is pre-1.0 from a single maintainer.

## Acceptance Criteria

### Projects

- AC-1: A logged-in user can create a project by supplying a name. It appears in their project list immediately under that name and persists across a page reload.
- AC-2: A project name is trimmed of surrounding whitespace and must be 1 to 100 characters. An empty or whitespace-only name is rejected with a message and no project is created. Two projects may share a name.
- AC-3: A user can rename a project. The new name is validated by the same rule as AC-2, persists across reload, and is reflected in the project list and anywhere else the project is labelled.
- AC-4: A user can delete a project. Deleting it also deletes its chat sessions, messages, documents and indexed chunks, and cancels any in-flight ingestion for those documents.
- AC-5: `/p/<projectId>` deep-links to a project. Requesting a project id that does not exist, or that belongs to another user, returns 404 and reveals nothing about it.
- AC-6: A user sees only their own projects. Project rows created by another user never appear in any list or API response.

### Chat sessions

- AC-7: Inside a project a user can create a chat session. It appears in the session list and is deep-linkable at `/p/<projectId>/c/<sessionId>`.
- AC-8: User and agent messages are persisted. Reloading `/p/<projectId>/c/<sessionId>` restores the full message history in order.
- AC-9: A new session starts with an empty history. Messages sent in one session never appear in another session, including sessions in the same project.
- AC-10: Every session in a project retrieves from that project's whole knowledge base, including documents uploaded before the session existed and documents uploaded by a different session in the same project.
- AC-11: A session the user has not named is labelled automatically from its first user message, truncated for display. Until that first message it carries a placeholder label.
- AC-12: A user can rename any chat session, including one carrying an automatic label. The new name is trimmed, must be 1 to 100 characters, and persists across reload.
- AC-13: Once a session has been renamed by the user, later messages never overwrite that name.
- AC-14: A user can delete a chat session. Deleting it deletes its messages and leaves the project's documents untouched.

### Knowledge base

- AC-15: A user can upload `.pdf`, `.md`, `.markdown` and `.txt` files into a project's knowledge base. The document appears in the project's document list with a live ingestion status (`pending` → `processing` → `storing` → `done`), and reaches `done` without the user reloading the page.
- AC-16: All three formats are extracted through one `markitdown-ts` call (`MarkItDown.convertBuffer` with the file extension), whose `markdown` output is what gets chunked. `pdf-parse` is removed from `package.json` and no longer imported anywhere in `src/`.
- AC-17: Any other file type is rejected with a message naming the accepted types. No document row, no chunk and no file remnant is stored.
- AC-18: WITHDRAWN. Page-count limiting is not implemented. `markitdown-ts` returns no page count, and adding a second PDF library solely to obtain one was judged not worth it. AC-19 is the only size limit; a PDF of any page count is accepted as long as its extracted text fits. The number is kept unused so the later criteria need no renumbering.
- AC-19: Any document whose extracted text exceeds 45,000 characters is rejected, whichever format it is. The error names the actual character count and the limit. Nothing is stored.
- AC-20: A document at or below both limits is accepted, chunked, embedded and indexed for both vector and full-text search.
- AC-21: Deleting a document removes it from the list and deletes all of its chunks, so its content is no longer retrievable. Deleting a document mid-ingestion cancels the ingestion.
- AC-22: An ingestion failure leaves the document in a `failed` state with the reason visible to the user, and the document is not retrievable.

### Retrieval and grounding

- AC-23: Retrieval runs both a Postgres full-text search over a `tsvector` column and a pgvector similarity search, then fuses the two ranked lists with Reciprocal Rank Fusion and returns the 5 best chunks (fewer only when fewer candidates exist).
- AC-24: A query whose distinguishing term is a rare literal string present in a document (an identifier, product code or unusual name) retrieves that document's chunk, in a case where vector-only search does not rank it in the top 5.
- AC-25: Retrieval is scoped to the current project and the requesting user. Chunks from another project, or from another user, are never returned.
- AC-26: An answer grounded in the knowledge base names the source document it drew from, and the named source is one of the documents actually retrieved for that turn.
- AC-27: When retrieval surfaces nothing relevant to the question, the agent states that it does not know and proposes a specific Google search query for the user to run. It does not answer from its own training data.
- AC-28: The agent may infer and reason across retrieved chunks, including combining facts from two documents, as long as every factual claim traces back to retrieved content. It may also answer questions about the conversation itself without retrieval.
- AC-29: Instructions embedded in retrieved document text are treated as data, not as commands to follow.

### Models and services

- AC-30: Chat uses `REASONING_MODEL` and embeddings use `EMBEDDING_MODEL` against `https://openrouter.ai/api/v1`, both authenticated with `OPENROUTER_API_KEY`. The stale `CHAT_MODEL_URL` / `EMBEDDING_URL` / `CHAT_MODEL_API_KEY` / `EMBEDDING_URL_KEY` variables are gone from the code and from `.env.example`. The verified working values are `REASONING_MODEL=google/gemma-4-31b-it` and `EMBEDDING_MODEL=openai/text-embedding-3-small`; `.env.example` documents them and `.env` must be updated to match, since both currently carry `:free` variants that fail.
- AC-31: When the chat model is unreachable the chat endpoint returns 503 with a message the UI shows, rather than hanging or returning a broken answer. When the embedding service is unreachable, ingestion fails with a stated reason and chat returns 503.

### Access and operations

- AC-34: Email verification is off. A newly signed-up user can log in immediately without clicking a verification link, and no verification email is attempted. The reset-password and verify-email routes are left in place but unreachable through normal sign-in.
- AC-35: The 100-user sign-up cap is removed. The `MAX_USERS` constant and the `beforeSignUp` hook that counted users are gone from `auth.ts`, and sign-up succeeds regardless of how many users already exist. No `USER_LIMIT_REACHED` error path remains anywhere in the code.
- AC-36: `agent-docs/config.md` documents how to check remaining OpenRouter budget, covering both `GET /api/v1/key` (this key's spend cap and remaining allowance) and `GET /api/v1/credits` (the account's purchased credits and total usage), with a runnable curl command for each and a note on how the two differ.

### Tests

- AC-32: Unit tests cover RRF fusion ordering, the character limit check at and across its boundary, extraction dispatch per file type, name validation and chunking. `pnpm test:unit --run` passes.
- AC-33: A Playwright e2e suite runs against the real app, the test database and the real OpenRouter models, and covers: sign up and log in with no verification step, create a project, rename it, upload a document, receive a grounded answer that names the source, rename the auto-labelled session, receive the "I don't know" plus Google query response for an uncovered question, and an oversized upload rejection. `pnpm test:e2e` passes.

## Edge Cases

- Upload of a PDF with no extractable text (scanned images): rejected as unreadable with a stated reason, not stored as an empty document.
- Upload of a corrupt or zero-byte file: rejected with a stated reason; the ingestion never hangs.
- Document whose extracted text is exactly 45,000 characters: accepted. 45,001: rejected.
- Long PDF whose extracted text still fits in 45,000 characters: accepted, however many pages it has.
- Chat in a project whose knowledge base is empty: the agent says it has nothing to draw on and suggests a Google query; it does not answer from training data.
- Two documents in one project sharing the same file name: both are stored and both are individually deletable; citations remain unambiguous enough for the user to tell which is which.
- Rename submitted with only whitespace, or with a name over 100 characters: rejected with a message, and the previous name stays intact.
- Session renamed before it has any messages: the user's name holds, and the first message does not replace it.
- First user message longer than the display label: truncated for the label while the message itself is stored in full.
- Project deleted while one of its documents is still ingesting: ingestion is cancelled and no orphan chunks remain.
- Two uploads started concurrently in the same project: both complete independently, neither cancels the other.
- Sending a message while a previous message in the same session is still awaiting a reply: the UI prevents a second in-flight request in that session.
- Query that matches nothing in either the full-text or the vector arm: retrieval returns an empty set and the agent takes the AC-23 path.
- Very short query (one or two characters): does not error; returns an empty or trivially small result set.

## Non-Goals

- Streaming chat responses. Answers arrive complete, as today.
- LLM summaries, key findings, methodology, limitations or reference extraction of any kind.
- Sharing projects between users, teams, roles or any collaboration feature. "Workplace" here means one user working with an agent.
- DOCX, HTML, CSV or image uploads; OCR of scanned PDFs.
- Actually executing a web search. The agent suggests a Google query; the user runs it.
- Cross-session memory beyond the shared document knowledge base. Sessions do not read each other's history.
- Improving PDF extraction fidelity over what `pdf-parse` produces today. See the accepted tradeoff above.
- A dedicated reranking model. RRF is the reranker.
- Migrating existing papers into the new schema.
- Replacing the polling-based status updates with WebSockets.
- Changes to authentication, email verification, password reset or theming.

## Open Questions

- Q-1: RESOLVED. OpenRouter does serve an OpenAI-compatible `/v1/embeddings` endpoint. Verified with a live call: `openai/text-embedding-3-small` returned 200 and a 1536-dimension vector, `qwen/qwen3-embedding-8b` returned 4096.
- Q-2: RESOLVED. The previously configured `nvidia/nemotron-3-embed-1b:free` returns 404 "No endpoints available matching your guardrail restrictions and data policy", so `EMBEDDING_MODEL` becomes `openai/text-embedding-3-small`, verified live at 200 with 1536 dimensions. The chunk vector column is therefore `vector(1536)`.
- Q-3: RESOLVED. The previously configured `google/gemma-4-31b-it:free` returned 429 "temporarily rate-limited upstream" on three consecutive live attempts, so `REASONING_MODEL` becomes `google/gemma-4-31b-it` on paid routing. Verified live at 200 via DeepInfra, and verified to emit a well-formed `tool_calls` response with `finish_reason: tool_calls` against a `retrieve` tool definition, which AC-23 depends on.
