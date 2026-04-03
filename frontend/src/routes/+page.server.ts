import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper, reference } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { PapersyFile } from '$lib/components/dedicated/app/types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return { papers: [], loggedIn: false };

	const rows = await db
		.select()
		.from(paper)
		.where(eq(paper.userId, session.user.id));

	const papers: PapersyFile[] = await Promise.all(
		rows.map(async (row) => {
			const refs = await db
				.select()
				.from(reference)
				.where(eq(reference.paperId, row.id));
			return {
				id: row.id,
				name: row.name,
				summaryData: row.summary
					? {
							summary: row.summary,
							keyFindings: JSON.parse(row.keyFindings ?? '[]'),
							methodology: row.methodology ?? '',
							limitations: row.limitations ?? '',
							references: refs.map((r) => r.text),
						}
					: undefined,
			};
		})
	);

	return { papers, loggedIn: true };
};
