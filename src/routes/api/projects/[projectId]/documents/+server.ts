import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { project, document } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { extractDocument, UnsupportedTypeError, EmptyExtractionError } from '$lib/server/extract';
import { checkCharLimit } from '$lib/server/limits';
import { ingestDocument } from '$lib/server/ingest';
import { activeIngestions } from '$lib/server/ingest-jobs';
import { JobStatus } from '$lib/utils/types';
import type { RequestHandler } from '@sveltejs/kit';

async function getOwnedProject(projectId: string, userId: string) {
	return db.query.project.findFirst({
		where: and(eq(project.id, projectId), eq(project.userId, userId))
	});
}

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedProject(params.projectId!, session.user.id);
	if (!row) error(404, 'Not found');

	const rows = await db.query.document.findMany({
		where: eq(document.projectId, row.id)
	});
	return json(
		rows.map((doc) => ({
			id: doc.id,
			name: doc.name,
			kind: doc.kind,
			status: doc.status,
			error: doc.error
		}))
	);
};

export const POST: RequestHandler = async ({ request, params }) => {
	const session = await requireSession(request.headers);
	const row = await getOwnedProject(params.projectId!, session.user.id);
	if (!row) error(404, 'Not found');

	const formData = await request.formData();
	const file = formData.get('file') as File;
	if (!file) error(400, 'No file provided.');

	const buffer = Buffer.from(await file.arrayBuffer());

	let extracted;
	try {
		extracted = await extractDocument(buffer, file.name);
	} catch (err) {
		if (err instanceof UnsupportedTypeError || err instanceof EmptyExtractionError) {
			error(400, err.message);
		}
		throw err;
	}

	const limitCheck = checkCharLimit(extracted.text.length);
	if (!limitCheck.ok) error(400, limitCheck.message);

	const documentId = crypto.randomUUID();
	await db.insert(document).values({
		id: documentId,
		projectId: row.id,
		userId: session.user.id,
		name: file.name,
		kind: extracted.kind,
		charCount: extracted.text.length,
		status: JobStatus.Pending,
		createdAt: new Date()
	});

	const controller = new AbortController();
	activeIngestions.set(documentId, controller);
	ingestDocument(documentId, row.id, session.user.id, extracted.text, controller.signal).catch(
		(err) => {
			console.error('Background ingestion failed:', err);
		}
	);

	return json({ documentId });
};
