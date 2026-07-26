import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { document } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { activeIngestions } from '$lib/server/ingest-jobs';
import type { RequestHandler } from '@sveltejs/kit';

async function getOwnedDocument(documentId: string, userId: string) {
	return db.query.document.findFirst({
		where: and(eq(document.id, documentId), eq(document.userId, userId))
	});
}

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedDocument(params.documentId!, session.user.id);
	if (!row) error(404, 'Not found');

	activeIngestions.get(row.id)?.abort();
	activeIngestions.delete(row.id);

	await db.delete(document).where(eq(document.id, row.id));
	return json({ ok: true });
};
