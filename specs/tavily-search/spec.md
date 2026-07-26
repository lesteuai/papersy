# Spec: Tavily web search for the project agent

Status: verified
Request: add tavily search into the ai agent. only use the search when asked, or doc search doesn't give a satisfying answer

## Overview
The project agent currently answers only from the project's document knowledge base via the `retrieve` tool, and when retrieval finds nothing it just suggests a Google query for the user to run manually. This adds a second tool backed by the Tavily search API, so the agent can search the web itself instead of only suggesting a search, either because the user explicitly asked for a web search or because the knowledge base had no relevant chunks.

## User Stories
- As a project user, I want to ask the agent to search the web, so that I can get an answer without leaving the chat to run the search myself.
- As a project user, I want the agent to try a web search automatically when the knowledge base has nothing relevant, so that I still get an answer grounded in a cited source instead of a dead end.
- As a project user, I want assistant replies quoting web pages to render as inert text and links, so that a hostile page cannot run script in my session by getting the agent to echo it.

## Acceptance Criteria
- AC-1: When a user message explicitly asks for a web/internet search (natural language, e.g. "search the web for X", "look this up online"), the agent calls the Tavily search tool for that query.
- AC-2: When the `retrieve` tool returns no relevant chunks for a query, the agent calls the Tavily search tool before giving up, using a query derived from the user's question.
- AC-3: When `retrieve` returns relevant chunks, the agent does not call the Tavily search tool, unless the user explicitly asked for a web search per AC-1.
- AC-4: Every factual claim sourced from a Tavily result names the result's title and includes its URL, distinct from the `<document name>` citation style used for knowledge-base claims.
- AC-5: If the Tavily search tool also returns nothing useful (after the knowledge base already had nothing), the agent plainly states that neither the knowledge base nor a web search answered the question, with no further suggestion.
- AC-6: If `TAVILY_API_KEY` is unset, or the Tavily API errors or times out, the search tool fails quietly (returns an empty/error result to the agent) and the agent falls back to its normal "knowledge base doesn't cover this" behavior. No health-check gate blocks chat, unlike the OpenRouter LLM/embedding services.
- AC-7: Assistant messages are sanitized before they are rendered as HTML. An assistant message containing an active-content payload (`<script>`, `<img onerror=...>`, `<iframe>`, `javascript:` href) renders with that payload neutralized and executes nothing, while ordinary markdown formatting (headings, lists, code blocks, emphasis, and links to `http`/`https` URLs) still renders as before.

## Edge Cases
- User asks for a web search on a topic that the knowledge base also covers well: Tavily is still called per AC-1 (explicit request always triggers it), and the agent may cite both sources.
- Tavily returns results but they're irrelevant to the query: agent uses its own judgment on whether to cite them or fall through to the AC-5 "neither source" answer.
- `TAVILY_API_KEY` missing entirely: tool call fails quietly per AC-6, no crash, no 503.
- A web page in the Tavily results contains markup designed to be echoed back by the agent: the reply is sanitized at render time per AC-7, so nothing executes. The prompt rule telling the agent to treat tool output as data is not treated as the enforcement boundary.
- A stored assistant message that predates sanitization contains a payload: it is sanitized on read at render time, since sanitization happens in the component and not on write.

## Non-Goals
- No UI control (toggle/button) for forcing web search; explicit requests are recognized from natural language only.
- No health check for the Tavily service akin to `checkLlmHealth`/`checkEmbeddingHealth`.
- No change to citation style for existing document-based answers.
- No sanitization of user-authored messages; they already render as plain text through `{message.text}`, not `{@html}`.
- No Content Security Policy work; AC-7 is scoped to sanitizing the markdown render path only.

## Open Questions
None.

## Verification
Verified on 2026-07-26 by driving the real `createProjectAgent` against a live database, a live OpenRouter model and the live Tavily API, inspecting the tool-call trace on `result.messages` rather than inferring tool use from reply text. Harness was temporary and is not committed.

- AC-1: pass (Q: "Search the web for the current stable version of Node.js." Tool trace: `["webSearch"]`. Reply cited `[Releases · nodejs/node](https://github.com/nodejs/node/releases)` and `[Node.js Releases](https://nodejs.org/en/about/previous-releases)`.)
- AC-2: pass (Q: "In what year did the Berlin Wall fall?" against a knowledge base holding only an unrelated regulator spec. Tool trace: `["retrieve","webSearch"]`, in that order, so `retrieve` was tried first and `webSearch` followed on the empty result.)
- AC-3: pass (Q: "What is the peak operating voltage of the QZX-88214-Nimbus?" against a knowledge base containing that fact. Tool trace: `["retrieve"]` only, no `webSearch`. Reply: "According to nimbus-spec.md, the peak operating voltage of the QZX-88214-Nimbus is 41.7 volts.")
- AC-4: pass (AC-2 reply: `The Berlin Wall fell in 1989, specifically on November 9, according to "Fall of the Berlin Wall | History | Research Starters" (https://www.ebsco.com/research-starters/history/fall-berlin-wall), "Fall of the Berlin Wall" (https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall) ...` Title plus URL per claim, distinct from the `<document name>` style used in the AC-3 reply.)
- AC-5: pass (`@tavily/core` mocked to return `results: []` so the tool emitted its real `No web results found for this query.` string, driven through the real agent against an empty project. Tool trace: `["retrieve","webSearch"]`. Reply: "Neither the knowledge base nor a web search answered the question." No follow-up suggestion. A live nonsense query could not force this path, since Tavily returns results for gibberish.)
- AC-6: pass (`TAVILY_API_KEY` set to an empty string at runtime. Tool trace: `["retrieve","webSearch"]`, no throw, no 503. Server logged `webSearch: TAVILY_API_KEY is unset, skipping web search` to stderr. Reply: "Neither the knowledge base nor a web search answered the question." Unit tests in `src/lib/server/search.spec.ts` additionally cover the thrown-error and timeout branch.)

- AC-7: pass (Verified twice. Unit level: `src/lib/components/dedicated/app/ChatMessage.svelte.spec.ts`, 3 cases in the vitest `client` project under headless Chrome. Confirmed the test is a real guard, not a tautology: `marked.parse` emits all four payloads intact and unescaped, so removing `DOMPurify.sanitize` fails every assertion. End to end: a hostile assistant message was written straight into `chat_message` for a real session, bypassing the agent, then loaded through the browser. All five `window` sentinels stayed unset, no dialog fired, and the rendered HTML was `<p>Here is what I found on the web.</p> <img src="x"> <p>[totally safe link](javascript:window.__xss_href = true)</p> <p><svg></svg></p> <h2>Real heading</h2> <ul><li>real list item</li></ul> <p><a href="https://example.com">real link</a></p>`. `script` and `iframe` removed outright, `onerror` and `onload` stripped while their tags survived, the `javascript:` link left as inert literal text with no anchor, and the heading, list and `https` anchor intact per the second clause.)

Regression suites after the AC-7 amendment: `vitest run` 30 passed across 8 files, exit code 0, covering both the node `server` project and the headless-Chrome `client` project. `playwright test` 1 passed, covering the web-search fallback and an explicit web-search request through the browser UI.

Known non-failure: running the `client` project prints a post-summary `[vite] (ssr) Error when evaluating SSR module .../@sveltejs/kit/src/runtime/server/index.js: transport was disconnected` trace. It appears after the run summary, the exit code is 0, and it names no file from this feature. It surfaces only once `ChatMessage.svelte.spec.ts` is in the run, so it is a dev-server teardown race triggered by rendering a real app component, not a test failure.

## Code Review
- Run by the user at Phase 5 with `/code-review medium`. Four findings, all confirmed against the source before acting.
- Fixed (commit d7cc64d): the e2e asserted `toContain('http')` against `innerText`, but `marked` renders `[title](url)` as an anchor whose text is the title alone, so the check only passed when the model happened to emit a bare URL. Reproduced directly: the markdown-link form yields no `http` in `innerText`. Now asserts on `a[href^="http"]`, which holds for both citation forms.
- Fixed (commit d7cc64d): `TAVILY_API_KEY` was absent from the environment variable table in `agent-docs/config.md`, the authoritative env reference. Added, including the no-health-check consequence.
- Fixed (commits d4caf59, b19f8a3, 25f8e21): XSS. `ChatMessage.svelte` rendered assistant text through `{@html marked.parse(...)}` with no sanitizer, and `marked` passes raw HTML through untouched. The sink predates this feature; the feature made it reachable, since web-search results put third-party page text into model context and assistant messages are persisted, so an echoed payload would re-execute on every load. Spec amended with AC-7 and re-approved, then fixed with `dompurify@3.4.12`.
- Acknowledged, not changed: the e2e now needs a live `TAVILY_API_KEY`, so a correctly degrading deployment per AC-6 would still show a red suite. The suite already requires a live database, a live OpenRouter key and a live model, and steps 5/5b exist specifically to prove `webSearch` is called, so loosening them to pass without a key would defeat their purpose.

## Change Log
- 2026-07-26: update: added AC-7 after the Phase 5 code review found the Tavily feature made an existing unsanitized `{@html}` render path reachable by third-party web content (commits d4caf59, b19f8a3, 25f8e21)
