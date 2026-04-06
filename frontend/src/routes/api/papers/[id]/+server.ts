import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getVectorStore } from '$lib/server/llm';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Unauthorized');

	const { id } = params;

	// Verify the paper belongs to this user
	const [row] = await db
		.select()
		.from(paper)
		.where(and(eq(paper.id, id), eq(paper.userId, session.user.id)));
	if (!row) error(404, 'Not found');

	// Delete vectors first
	const vectorStore = await getVectorStore();
	await vectorStore.delete({ filter: { paperId: id } });
	await vectorStore.end();

	// Delete paper row (cascades to reference table)
	await db.delete(paper).where(eq(paper.id, id));

	return new Response(null, { status: 204 });
};
