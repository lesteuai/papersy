import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper } from '$lib/server/db/schema';
import { eq, ne } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { PapersyFile } from '$lib/utils/types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return { papers: [], loggedIn: false };

	// Load all papers for this user with basic info only (id, name)
	// Full summary details will be loaded on-demand when user clicks on a paper
	const rows = await db.query.paper.findMany({
		where: eq(paper.userId, session.user.id),
		with: {
			jobs: {
				where: (job) => ne(job.status, 'done'),
				limit: 1,
			},
		},
	});

	const papers: PapersyFile[] = rows.map((row) => {
		// Currently there is only one job per paper
		const activeJob = row.jobs[0];
		return {
			id: row.id,
			name: row.name,
			summaryData: undefined,
			jobId: activeJob?.id,
			jobStatus: activeJob?.status,
			uploadError: activeJob?.error || undefined
		};
	});

	return { papers, loggedIn: true };
};
