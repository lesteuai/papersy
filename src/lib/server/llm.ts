import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { env } from '$env/dynamic/private';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export function getLlm() {
	return new ChatOpenAI({
		model: env.REASONING_MODEL,
		configuration: {
			baseURL: OPENROUTER_BASE_URL,
			apiKey: env.OPENROUTER_API_KEY,
		},
	});
}

export function getEmbeddings() {
	return new OpenAIEmbeddings({
		model: env.EMBEDDING_MODEL,
		configuration: {
			baseURL: OPENROUTER_BASE_URL,
			apiKey: env.OPENROUTER_API_KEY,
		},
	});
}

export async function checkLlmHealth(): Promise<boolean> {
	try {
		const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
			headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
			signal: AbortSignal.timeout(5000),
		});
		return res.ok;
	} catch {
		return false;
	}
}

export async function checkEmbeddingHealth(): Promise<boolean> {
	try {
		const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
			headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
			signal: AbortSignal.timeout(5000),
		});
		return res.ok;
	} catch {
		return false;
	}
}
