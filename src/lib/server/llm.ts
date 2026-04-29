import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { createAgent, tool } from 'langchain';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';

const PROMPT_PATH = path.resolve('default-prompts', 'chatbot.txt');
const promptTemplate = await fs.readFile(PROMPT_PATH, 'utf-8');

function buildSystemPrompt(name: string, summary: string | null): string {
	return promptTemplate
		.replace('{paperName}', name)
		.replace('{paperSummary}', summary ?? 'Not yet available.');
}

// Summarization schema — matches SummaryView's SummaryData shape
export const SummarySchema = z.object({
	name: z.string().nullable().describe('Title of the paper from the first page. null if it cannot be determined.'),
	summary: z.string().describe('Concise summary of the paper in 3-5 sentences covering objective, methodology, and findings'),
	key_findings: z.array(z.string()).length(3).describe('Exactly 3 most important insights or contributions, each 1-2 sentences'),
	references: z.array(z.string()).describe('All references extracted from the paper, without leading numeric labels. Empty array if none found.'),
	methodology: z.string().describe('Summary of how the study was conducted (2-4 sentences), or exactly "No methodology section found." if no Methodology/Methods section exists'),
	limitations: z.string().describe('Summary of stated limitations (2-4 sentences), or exactly "No limitations section found." if no Limitations section exists'),
});

export type SummaryResult = z.infer<typeof SummarySchema>;

const pgConfig = {
	host: env.PG_HOST ?? 'localhost',
	port: Number(env.PG_PORT ?? 5432),
	user: env.PG_USER ?? 'postgres',
	password: env.PG_PASSWORD ?? '1',
	database: env.PG_DATABASE ?? 'postgres',
};

const vectorStoreConfig = {
	postgresConnectionOptions: pgConfig,
	tableName: 'documents',
	columns: {
		idColumnName: 'id',
		vectorColumnName: 'vector',
		contentColumnName: 'content',
		metadataColumnName: 'metadata',
	},
};

export function getEmbeddings() {
	return new OpenAIEmbeddings({
		configuration: {
			baseURL: env.EMBEDDING_URL,
			apiKey: env.EMBEDDING_URL_KEY,
		},
	});
}

export function getLlm() {
	return new ChatOpenAI({
		model: 'local',
		configuration: {
			baseURL: env.CHAT_MODEL_URL,
			apiKey: env.CHAT_MODEL_API_KEY,
		},
	});
}

export async function checkLlmHealth(): Promise<boolean> {
	try {
		const res = await fetch(`${env.CHAT_MODEL_URL}/models`, {
			signal: AbortSignal.timeout(5000),
		});
		return res.ok;
	} catch {
		return false;
	}
}

export async function getVectorStore() {
	return PGVectorStore.initialize(getEmbeddings(), vectorStoreConfig);
}

export async function createRagAgent(paperId: string, paperContext: { name: string; summary: string | null }) {
	const vectorStore = await getVectorStore();

	const retrieve = tool(
		async ({ query }) => {
			const docs = await vectorStore.similaritySearch(query, 4, { paperId });
			if (docs.length === 0) return ['No relevant documents found.', []];
			const serialized = docs
				.map((doc) => `Paper: ${doc.metadata.source ?? paperId}\nContent: ${doc.pageContent}`)
				.join('\n');
			return [serialized, docs];
		},
		{
			name: 'retrieve',
			description: 'Retrieve information related to a query from the paper.',
			schema: z.object({ query: z.string() }),
			responseFormat: 'content_and_artifact',
		}
	);

	const systemPrompt = buildSystemPrompt(paperContext.name, paperContext.summary);
	const model = getLlm();
	const agent = createAgent({ model, tools: [retrieve], systemPrompt });
	return { agent, vectorStore };
}
