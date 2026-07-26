import { tool } from 'langchain';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { env } from '$env/dynamic/private';

export const webSearch = tool(
	async ({ query }) => {
		if (!env.TAVILY_API_KEY) {
			console.error('webSearch: TAVILY_API_KEY is unset, skipping web search');
			return ['Web search is unavailable.', []];
		}

		try {
			const client = tavily({ apiKey: env.TAVILY_API_KEY });
			const response = await client.search(query, { maxResults: 5, timeout: 8 });

			if (response.results.length === 0) return ['No web results found for this query.', []];

			const serialized = response.results
				.map((result) => `Title: ${result.title}\nURL: ${result.url}\n---\n${result.content}\n---`)
				.join('\n\n');
			return [serialized, response.results];
		} catch (error) {
			console.error('webSearch: Tavily search failed', error);
			return ['Web search is unavailable.', []];
		}
	},
	{
		name: 'webSearch',
		description:
			'Search the web for up-to-date information when the project knowledge base has no answer, or when the user explicitly asks for a web search.',
		schema: z.object({ query: z.string() }),
		responseFormat: 'content_and_artifact'
	}
);
