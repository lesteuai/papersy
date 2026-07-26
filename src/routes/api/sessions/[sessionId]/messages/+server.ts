import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { chatSession, chatMessage } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const owned = await db.query.chatSession.findFirst({
		where: and(eq(chatSession.id, params.sessionId!), eq(chatSession.userId, session.user.id))
	});
	if (!owned) error(404, 'Not found');

	const rows = await db.query.chatMessage.findMany({
		where: eq(chatMessage.sessionId, owned.id),
		orderBy: asc(chatMessage.createdAt)
	});

	return json(rows.map((row) => ({ role: row.role, text: row.content })));
};
