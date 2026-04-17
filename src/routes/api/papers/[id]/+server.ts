import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper, job } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getVectorStore } from '$lib/server/llm';
import { activeJobs } from '$lib/server/upload-jobs';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);

	const { id } = params;

	// Fetch paper with references
	const row = await db.query.paper.findFirst({
		where: and(eq(paper.id, id), eq(paper.userId, session.user.id)),
		with: { references: true },
	});
	if (!row) error(404, 'Not found');

	return json({
		id: row.id,
		name: row.name,
		summaryData: row.summary
			? {
					summary: row.summary,
					keyFindings: JSON.parse(row.keyFindings ?? '[]'),
					methodology: row.methodology ?? '',
					limitations: row.limitations ?? '',
					references: row.references.map((r) => r.text),
				}
			: undefined,
	});
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);

	const { id } = params;

	// Verify the paper belongs to this user
	const row = await db.query.paper.findFirst({
		where: and(eq(paper.id, id), eq(paper.userId, session.user.id)),
	});
	if (!row) error(404, 'Not found');

	// Check if there is an active job processing this paper and cancel it
	const activeJob = await db.query.job.findFirst({
		where: and(
			eq(job.paperId, id),
			eq(job.userId, session.user.id)
		),
	});
	if (activeJob) {
		const controller = activeJobs.get(activeJob.id);
		if (controller) {
			controller.abort();
		}
	}

	// Delete vectors first
	const vectorStore = await getVectorStore();
	await vectorStore.delete({ filter: { paperId: id } });
	await vectorStore.end();

	// Delete paper row (cascades to reference table)
	await db.delete(paper).where(eq(paper.id, id));

	return new Response(null, { status: 204 });
};
