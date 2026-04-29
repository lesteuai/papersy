import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { checkLlmHealth, createRagAgent } from '$lib/server/llm';
import { db } from '$lib/server/db';
import { paper } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const session = await requireSession(request.headers);

	const { paperId, messages } = await request.json() as {
		paperId: string;
		messages: { role: 'user' | 'ai'; text: string }[];
	};
	if (!paperId) error(400, 'paperId required');

	const row = await db.query.paper.findFirst({
		where: and(eq(paper.id, paperId), eq(paper.userId, session.user.id)),
	});
	if (!row) error(404, 'Paper not found');

	const healthy = await checkLlmHealth();
	if (!healthy) error(503, 'LLM service unavailable');

	const { agent, vectorStore } = await createRagAgent(paperId, { name: row.name, summary: row.summary });

	const history = messages.map((m) =>
		m.role === 'user' ? new HumanMessage(m.text) : new AIMessage(m.text)
	);

	const result = await agent.invoke({ messages: history });

	await vectorStore.end();
	
	const last = result.messages.at(-1);
	const text = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content);

	return json({ text });
};
