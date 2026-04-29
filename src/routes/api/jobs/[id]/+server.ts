import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { job } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);

	const { id } = params;
	if (!id) error(400, 'Missing paper id');

	// Verify job belongs to this user
	const jobRow = await db.query.job.findFirst({
		where: and(eq(job.id, id), eq(job.userId, session.user.id)),
	});
	if (!jobRow) error(404, 'Job not found');

	return json({
		status: jobRow.status,
		paperId: jobRow.paperId,
		error: jobRow.error,
	});
};
