import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateName } from '$lib/utils/session-label';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	const session = await requireSession(request.headers);
	const rows = await db.query.project.findMany({
		where: eq(project.userId, session.user.id)
	});
	return json(rows.map((row) => ({ id: row.id, name: row.name, createdAt: row.createdAt })));
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await requireSession(request.headers);
	const body = await request.json();
	const validated = validateName(String(body?.name ?? ''));
	if (!validated.ok) error(400, validated.message);

	const row = {
		id: crypto.randomUUID(),
		userId: session.user.id,
		name: validated.value,
		createdAt: new Date()
	};
	await db.insert(project).values(row);
	return json({ id: row.id, name: row.name, createdAt: row.createdAt });
};
