# Plan: Tavily web search for the project agent

Status: approved
Spec: spec.md

## Approach
Add a second LangChain tool, `webSearch`, built on the official `@tavily/core` client, and register it alongside the existing `retrieve` tool in `createProjectAgent`. The system prompt is the only place that governs *when* the agent uses it: it is instructed to call `webSearch` when the user explicitly asks for a web/internet search, or when `retrieve` returns no relevant chunks, and to cite web results as `title (url)` distinct from the `<document name>` style. The tool itself has no gating logic; it just calls Tavily and returns serialized results, or a plain "no results" / "search unavailable" string on empty results, missing key, or error, so the agent always has something to reason over and never crashes the chat turn.

## Affected Code
- `src/lib/server/search.ts` (new): `webSearch` tool wrapping `@tavily/core`'s `client.search()`. Returns `content_and_artifact` like `retrieve` does, serializing `title`, `url`, `content` per result. Catches missing `TAVILY_API_KEY`, thrown errors, and timeouts, returning a message the agent can read as "no web results" rather than throwing. Serves AC-1, AC-2, AC-4, AC-6.
- `src/lib/server/agent.ts`: import and register `webSearch` in the `tools` array passed to `createAgent`. Serves AC-1 through AC-6 (the tool must be available for the prompt instructions to have any effect).
- `default-prompts/chatbot.txt`: extend the retrieval-failure paragraph (currently the one starting "If retrieve returns nothing relevant...") to say the agent should first try `webSearch` before concluding it doesn't know, add a new paragraph for explicit web-search requests, add a citation rule for web sources (name + URL, distinct from the document-name style), and restate the final fallback message for when both `retrieve` and `webSearch` come up empty. Serves AC-1, AC-2, AC-3, AC-4, AC-5.
- `.env.example`: add `TAVILY_API_KEY=` under the "AI and tools" section, next to `OPENROUTER_API_KEY`. Serves AC-6 (documents the variable the tool reads).
- `package.json`: add `@tavily/core` as a dependency.
- `agent-docs/server.md`: document the new `search.ts` module and its tool, consistent with how `retrieval.ts`/`agent.ts` are already documented there.
- `src/lib/components/dedicated/app/ChatMessage.svelte`: wrap the existing `{@html marked.parse(message.text)}` at line 17 in `DOMPurify.sanitize(...)`. Serves AC-7.
- `src/lib/components/dedicated/app/ChatMessage.svelte.spec.ts` (new): component test in the vitest `client` project asserting payloads are neutralized and markdown still renders. Serves AC-7.
- `agent-docs/components.md`: note the sanitization step on the assistant render path. Serves AC-7.

## AC-7 Approach (amendment)
Sanitize at render, in the one component that uses `{@html}`. `marked.parse` produces the HTML and `DOMPurify.sanitize` cleans it immediately before it reaches the DOM, so the fix covers assistant messages already persisted before this change as well as new ones. Sanitizing on render rather than on write is what makes that true.

Use DOMPurify's **default** configuration. The default allow-list already permits every tag `ChatMessage.svelte` styles through its `:global()` rules (`h1`-`h6`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`, `strong`, `em`, `a`, `hr`) while stripping `script`, event-handler attributes such as `onerror`, and `javascript:` URLs. The tight markdown allow-list from DOMPurify's own wiki is the wrong choice here: it omits `h1`-`h6` and `hr`, which would silently flatten replies and violate the second clause of AC-7.

## Libraries (amendment)
- `dompurify@3.4.12`: sanitizes the markdown-rendered HTML. Plain `dompurify`, not `isomorphic-dompurify`, because `src/routes/+layout.ts` sets `ssr = false`, so no component ever executes server-side and the jsdom dependency that `isomorphic-dompurify` pulls in buys nothing.

## Risks (amendment)
- **DOMPurify is coupled to `ssr = false`.** Verified by running the installed `dompurify@3.4.12` under Node: `isSupported` is `false`, `typeof sanitize` is `undefined`, and calling it throws `TypeError: DOMPurify.sanitize is not a function`. The constructor returns early at `purify.cjs.js:431` before assigning `sanitize`, so a future `ssr = true` would break the render loudly rather than silently emitting unsanitized HTML. The `if (!DOMPurify.isSupported) return dirty;` fail-open at `purify.cjs.js:2141` is unreachable here; it needs a window whose `document.implementation.createHTMLDocument` is missing, not the no-window case. Mitigation: accept, since the failure is loud, and record the coupling here and in `agent-docs/components.md`.
- **Sanitizer config drift breaks rendering silently.** Tightening `ALLOWED_TAGS` later would strip styled tags with no error. Mitigation: the AC-7 component test asserts markdown structure survives, so it fails if the config is narrowed.

## Data Model and Contracts
No database or API route changes. New tool contract:

```typescript
// src/lib/server/search.ts
export function webSearch(): the tool created via tool(...) from 'langchain'

// tool call: input { query: string }
// content: string (serialized "Title: ...\nURL: ...\n---\nContent: ...\n---" per result, or a fallback message)
// artifact: Array<{ title: string; url: string; content: string }> (empty array on failure/no results)
```

Mirrors the existing `retrieve` tool's `responseFormat: 'content_and_artifact'` shape in `agent.ts` so the frontend's existing handling of tool artifacts (if any) needs no changes.

## Libraries
- `@tavily/core` (latest, official Tavily TS/JS SDK): provides `tavily({ apiKey }).search(query, options)`. Used with `maxResults: 5` (matches the existing hybrid-search chunk count) and a `timeout` a few seconds under the tool call's own budget so failures surface as a caught error rather than hanging the chat turn.

## Risks
- **Silent failures hide misconfiguration**: because AC-6 requires quiet degradation, a missing or invalid `TAVILY_API_KEY` produces no visible error anywhere except normal agent behavior (falls back to "doesn't know"). Mitigation: log the failure server-side (console.error) so it's visible in server logs without surfacing to the user or gating chat.
- **Prompt-only gating is not enforced in code**: whether the agent actually calls `webSearch` only when appropriate depends on the LLM following prompt instructions, not code logic. Mitigation: accept this, consistent with how `retrieve`'s citation discipline is also prompt-only today; verify via manual testing in Phase 5.
