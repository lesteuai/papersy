import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper, reference, job } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { PapersyFile } from '$lib/utils/types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return { papers: [], loggedIn: false };

	// Load all papers for this user (including empty ones being processed)
	const rows = await db.query.paper.findMany({
		where: eq(paper.userId, session.user.id),
		with: { references: true },
	});

	// Load active jobs (pending/processing) for this user
	const activeJobs = await db.query.job.findMany({
		where: eq(job.userId, session.user.id),
	});

	// Build a map of paperId -> active job
	const jobByPaperId: Record<string, { id: string; status: string }> = {};
	for (const j of activeJobs) {
		if (j.paperId && (j.status === 'pending' || j.status === 'processing')) {
			jobByPaperId[j.paperId] = { id: j.id, status: j.status };
		}
	}

	const papers: PapersyFile[] = rows.map((row) => {
		const activeJob = jobByPaperId[row.id];
		return {
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
			jobId: activeJob?.id,
			jobStatus: activeJob?.status,
		};
	});

	return { papers, loggedIn: true };
};
