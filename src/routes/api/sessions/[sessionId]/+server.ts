import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { chatSession } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { validateName, sessionLabel } from '$lib/utils/session-label';
import type { RequestHandler } from '@sveltejs/kit';

async function getOwnedSession(sessionId: string, userId: string) {
	return db.query.chatSession.findFirst({
		where: and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId))
	});
}

export const PATCH: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedSession(params.sessionId!, session.user.id);
	if (!row) error(404, 'Not found');

	const body = await request.json();
	const validated = validateName(String(body?.name ?? ''));
	if (!validated.ok) error(400, validated.message);

	await db.update(chatSession).set({ name: validated.value }).where(eq(chatSession.id, row.id));
	return json({
		id: row.id,
		projectId: row.projectId,
		name: validated.value,
		label: sessionLabel(validated.value),
		createdAt: row.createdAt
	});
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedSession(params.sessionId!, session.user.id);
	if (!row) error(404, 'Not found');

	await db.delete(chatSession).where(eq(chatSession.id, row.id));
	return json({ ok: true });
};
