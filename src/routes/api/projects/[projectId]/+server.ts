import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project, document } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { validateName } from '$lib/utils/session-label';
import { activeIngestions } from '$lib/server/ingest-jobs';
import type { RequestHandler } from '@sveltejs/kit';

async function getOwnedProject(projectId: string, userId: string) {
	return db.query.project.findFirst({
		where: and(eq(project.id, projectId), eq(project.userId, userId))
	});
}

export const PATCH: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedProject(params.projectId!, session.user.id);
	if (!row) error(404, 'Not found');

	const body = await request.json();
	const validated = validateName(String(body?.name ?? ''));
	if (!validated.ok) error(400, validated.message);

	await db.update(project).set({ name: validated.value }).where(eq(project.id, row.id));
	return json({ id: row.id, name: validated.value, createdAt: row.createdAt });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedProject(params.projectId!, session.user.id);
	if (!row) error(404, 'Not found');

	const docs = await db.query.document.findMany({
		where: eq(document.projectId, row.id),
		columns: { id: true }
	});
	for (const doc of docs) {
		activeIngestions.get(doc.id)?.abort();
		activeIngestions.delete(doc.id);
	}

	await db.delete(project).where(eq(project.id, row.id));
	return json({ ok: true });
};
