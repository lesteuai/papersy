import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project, chatSession, chatMessage } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { sessionLabel } from '$lib/utils/session-label';
import type { RequestHandler } from '@sveltejs/kit';

async function getFirstUserMessage(sessionId: string) {
	const row = await db.query.chatMessage.findFirst({
		where: and(eq(chatMessage.sessionId, sessionId), eq(chatMessage.role, 'user')),
		orderBy: asc(chatMessage.createdAt)
	});
	return row?.content;
}

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const owned = await db.query.project.findFirst({
		where: and(eq(project.id, params.projectId!), eq(project.userId, session.user.id))
	});
	if (!owned) error(404, 'Not found');

	const rows = await db.query.chatSession.findMany({
		where: eq(chatSession.projectId, owned.id)
	});

	const result = await Promise.all(
		rows.map(async (row) => {
			const firstUserMessage = row.name ? undefined : await getFirstUserMessage(row.id);
			return {
				id: row.id,
				projectId: row.projectId,
				name: row.name,
				label: sessionLabel(row.name, firstUserMessage),
				createdAt: row.createdAt
			};
		})
	);

	return json(result);
};

export const POST: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const owned = await db.query.project.findFirst({
		where: and(eq(project.id, params.projectId!), eq(project.userId, session.user.id))
	});
	if (!owned) error(404, 'Not found');

	const row = {
		id: crypto.randomUUID(),
		projectId: owned.id,
		userId: session.user.id,
		name: null,
		createdAt: new Date()
	};
	await db.insert(chatSession).values(row);
	return json({
		id: row.id,
		projectId: row.projectId,
		name: row.name,
		label: sessionLabel(row.name, undefined),
		createdAt: row.createdAt
	});
};
