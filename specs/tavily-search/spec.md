# Spec: Tavily web search for the project agent

Status: approved
Request: add tavily search into the ai agent. only use the search when asked, or doc search doesn't give a satisfying answer

## Overview
The project agent currently answers only from the project's document knowledge base via the `retrieve` tool, and when retrieval finds nothing it just suggests a Google query for the user to run manually. This adds a second tool backed by the Tavily search API, so the agent can search the web itself instead of only suggesting a search, either because the user explicitly asked for a web search or because the knowledge base had no relevant chunks.

## User Stories
- As a project user, I want to ask the agent to search the web, so that I can get an answer without leaving the chat to run the search myself.
- As a project user, I want the agent to try a web search automatically when the knowledge base has nothing relevant, so that I still get an answer grounded in a cited source instead of a dead end.

## Acceptance Criteria
- AC-1: When a user message explicitly asks for a web/internet search (natural language, e.g. "search the web for X", "look this up online"), the agent calls the Tavily search tool for that query.
- AC-2: When the `retrieve` tool returns no relevant chunks for a query, the agent calls the Tavily search tool before giving up, using a query derived from the user's question.
- AC-3: When `retrieve` returns relevant chunks, the agent does not call the Tavily search tool, unless the user explicitly asked for a web search per AC-1.
- AC-4: Every factual claim sourced from a Tavily result names the result's title and includes its URL, distinct from the `<document name>` citation style used for knowledge-base claims.
- AC-5: If the Tavily search tool also returns nothing useful (after the knowledge base already had nothing), the agent plainly states that neither the knowledge base nor a web search answered the question, with no further suggestion.
- AC-6: If `TAVILY_API_KEY` is unset, or the Tavily API errors or times out, the search tool fails quietly (returns an empty/error result to the agent) and the agent falls back to its normal "knowledge base doesn't cover this" behavior. No health-check gate blocks chat, unlike the OpenRouter LLM/embedding services.

## Edge Cases
- User asks for a web search on a topic that the knowledge base also covers well: Tavily is still called per AC-1 (explicit request always triggers it), and the agent may cite both sources.
- Tavily returns results but they're irrelevant to the query: agent uses its own judgment on whether to cite them or fall through to the AC-5 "neither source" answer.
- `TAVILY_API_KEY` missing entirely: tool call fails quietly per AC-6, no crash, no 503.

## Non-Goals
- No UI control (toggle/button) for forcing web search; explicit requests are recognized from natural language only.
- No health check for the Tavily service akin to `checkLlmHealth`/`checkEmbeddingHealth`.
- No change to citation style for existing document-based answers.

## Open Questions
None.
