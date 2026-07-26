# Tasks: Tavily web search for the project agent

Status: draft

## Wave 1
- [ ] T1: Add `@tavily/core` dependency and `TAVILY_API_KEY` env var
  - Satisfies: AC-6
  - Files: `package.json`, `package-lock.json`, `.env.example`
  - Do: Run `npm install @tavily/core` to add the official Tavily TS/JS SDK as a dependency. Add `TAVILY_API_KEY=` to `.env.example` under the "AI and tools" section, right after `OPENROUTER_API_KEY=`.
  - Done when: `@tavily/core` appears in `package.json` dependencies and `node_modules`, and `.env.example` contains a `TAVILY_API_KEY=` line under "AI and tools".

- [ ] T2: Create the `webSearch` tool in `src/lib/server/search.ts`
  - Satisfies: AC-1, AC-2, AC-4, AC-6
  - Files: `src/lib/server/search.ts` (new)
  - Do: Create a LangChain tool named `webSearch` using `tool(...)` from `langchain` (same import as used in `src/lib/server/agent.ts`), with `responseFormat: 'content_and_artifact'`, mirroring the shape of the existing `retrieve` tool in `src/lib/server/agent.ts`. Schema: `z.object({ query: z.string() })`. Inside the handler: read `TAVILY_API_KEY` via `$env/dynamic/private` (same pattern as `src/lib/server/llm.ts`'s use of `env.OPENROUTER_API_KEY`). If the key is missing, return `['Web search is unavailable.', []]` immediately without calling Tavily. Otherwise, construct the client with `tavily({ apiKey: env.TAVILY_API_KEY })` from `@tavily/core`, call `client.search(query, { maxResults: 5, timeout: 8 })` inside a try/catch. On success with `results.length === 0`, return `['No web results found for this query.', []]`. On success with results, serialize each result as `` `Title: ${title}\nURL: ${url}\n---\n${content}\n---` `` joined by `\n\n` for the content string, and return `[serialized, results]` (the raw `results` array as the artifact, each item having `title`, `url`, `content` per the SDK's `TavilySearchResult` shape). On any thrown error (including timeout), `console.error` the error server-side and return `['Web search is unavailable.', []]` — never throw out of the tool handler. Tool description: `'Search the web for up-to-date information when the project knowledge base has no answer, or when the user explicitly asks for a web search.'`
  - Done when: `src/lib/server/search.ts` exports `webSearch`, a call with a valid key and query returns serialized title/url/content text plus a matching artifact array, a call with `TAVILY_API_KEY` unset returns the unavailable message with an empty artifact array and does not throw, and a forced network error (e.g. temporarily invalid `baseURL` or unreachable host) is caught and also returns the unavailable message without throwing.

## Wave 2
- [ ] T3: Register `webSearch` in the agent's tool list
  - Satisfies: AC-1, AC-2, AC-3, AC-5, AC-6
  - Files: `src/lib/server/agent.ts`
  - Do: Import `webSearch` from `./search` (the module created in T2) and add it to the `tools` array passed to `createAgent`, alongside the existing `retrieve` tool: `tools: [retrieve, webSearch]`. No other changes to `agent.ts`.
  - Done when: `createProjectAgent` builds an agent with both `retrieve` and `webSearch` in its `tools` array, verified by reading the file (no test harness exists for agent construction beyond manual chat testing in Phase 5).

- [ ] T4: Update the system prompt to govern when `webSearch` is used and how it's cited
  - Satisfies: AC-1, AC-2, AC-3, AC-4, AC-5
  - Files: `default-prompts/chatbot.txt`
  - Do: Edit the prompt to add, in this order: (1) a new paragraph instructing the agent to call `webSearch` whenever the user's message explicitly asks for a web/internet search (e.g. phrases like "search the web", "look this up online", "search online"), even if the knowledge base might also cover the topic; (2) revise the existing paragraph that begins "If retrieve returns nothing relevant..." so that instead of only proposing a Google query, the agent first calls `webSearch` with a query derived from the user's question before concluding anything, and explicitly does NOT call `webSearch` when `retrieve` already returned relevant chunks (unless the user explicitly asked per the new paragraph); (3) a citation rule paragraph stating that every factual claim sourced from `webSearch` must name the result's title and include its URL (for example: "According to <title> (<url>), ..."), kept distinct from the existing "<document name>" citation style used for knowledge-base claims; (4) revise the final fallback so that if both `retrieve` and `webSearch` come up empty, the agent plainly states that neither the knowledge base nor a web search answered the question, with no further suggestion (drop the old "propose one concrete Google search query" instruction, since the agent can now search itself).
  - Done when: `default-prompts/chatbot.txt` contains all four elements above, and no longer instructs the agent to propose a manual Google query as the terminal fallback.

## Wave 3
- [ ] T5: Document the new search module
  - Satisfies: AC-1, AC-2, AC-4, AC-6
  - Files: `agent-docs/server.md`
  - Do: Read `agent-docs/server.md` to see how `retrieval.ts` and `agent.ts` are currently documented (module purpose, key exports, how it's wired into the agent). Add an equivalent entry for `src/lib/server/search.ts`: its `webSearch` tool export, that it wraps `@tavily/core`, that it degrades silently (no health check, unlike the OpenRouter services) when `TAVILY_API_KEY` is missing or the API errors, and that it's registered in `agent.ts` alongside `retrieve`.
  - Done when: `agent-docs/server.md` has a section describing `search.ts`/`webSearch` consistent in style and depth with the existing `retrieval.ts`/`agent.ts` entries.

## Coverage
- AC-1: T2, T3, T4
- AC-2: T2, T3, T4
- AC-3: T3, T4
- AC-4: T2, T4
- AC-5: T3, T4
- AC-6: T1, T2, T3
