import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { checkLlmHealth, checkEmbeddingHealth } from '$lib/server/llm';
import { createProjectAgent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { chatSession, chatMessage, project } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const session = await requireSession(request.headers);

	const { sessionId, text } = (await request.json()) as { sessionId: string; text: string };
	if (!sessionId || !text) error(400, 'sessionId and text required');

	const owned = await db.query.chatSession.findFirst({
		where: and(eq(chatSession.id, sessionId), eq(chatSession.userId, session.user.id))
	});
	if (!owned) error(404, 'Session not found');

	const llmHealthy = await checkLlmHealth();
	if (!llmHealthy) error(503, 'Chat model is unavailable. Try again shortly.');

	const embeddingHealthy = await checkEmbeddingHealth();
	if (!embeddingHealthy) error(503, 'Embedding service is unavailable. Try again shortly.');

	const projectRow = await db.query.project.findFirst({
		where: eq(project.id, owned.projectId)
	});
	if (!projectRow) error(404, 'Project not found');

	// Load history before persisting this turn's user message, so it is not duplicated below.
	const priorMessages = await db.query.chatMessage.findMany({
		where: eq(chatMessage.sessionId, owned.id),
		orderBy: asc(chatMessage.createdAt)
	});

	// Persisted before invoking the agent so createdAt ordering reflects real send time.
	await db.insert(chatMessage).values({
		id: crypto.randomUUID(),
		sessionId: owned.id,
		role: 'user',
		content: text
	});

	const history = [
		...priorMessages.map((m) =>
			m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
		),
		new HumanMessage(text)
	];

	const agent = createProjectAgent({
		projectId: owned.projectId,
		userId: session.user.id,
		projectName: projectRow.name
	});

	// The health check above pings a public OpenRouter endpoint, so it cannot see an invalid
	// key, a rate limit or a provider outage. Catch those here rather than letting them
	// surface as a bare 500 the UI cannot explain.
	let result;
	try {
		result = await agent.invoke({ messages: history });
	} catch (err) {
		console.error('Chat model call failed:', err instanceof Error ? err.message : err);
		error(503, 'The chat model is unavailable right now. Try again shortly.');
	}

	const last = result.messages.at(-1);
	const replyText = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content);

	// Persisted after the agent returns, guaranteeing a later createdAt than the user message.
	await db.insert(chatMessage).values({
		id: crypto.randomUUID(),
		sessionId: owned.id,
		role: 'assistant',
		content: replyText
	});

	return json({ text: replyText });
};
