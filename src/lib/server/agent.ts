import { createAgent, tool } from 'langchain';
import { z } from 'zod';
import { getLlm } from '$lib/server/llm';
import { hybridSearch } from '$lib/server/retrieval';
import { webSearch } from '$lib/server/search';
import { getDefaultPrompt } from './system-prompt';

export function createProjectAgent({
	projectId,
	userId,
	projectName
}: {
	projectId: string;
	userId: string;
	projectName: string;
}) {
	const retrieve = tool(
		async ({ query }) => {
			const chunks = await hybridSearch(projectId, userId, query);
			if (chunks.length === 0) return ['No relevant documents found in the knowledge base.', []];
			const serialized = chunks
				.map((chunk) => `Source: ${chunk.source}\n---\n${chunk.content}\n---`)
				.join('\n\n');
			return [serialized, chunks];
		},
		{
			name: 'retrieve',
			description: 'Retrieve relevant chunks from the project knowledge base for a query.',
			schema: z.object({ query: z.string() }),
			responseFormat: 'content_and_artifact'
		}
	);

	const systemPrompt = getDefaultPrompt(projectName);
	const model = getLlm();
	return createAgent({ model, tools: [retrieve, webSearch], systemPrompt });
}
