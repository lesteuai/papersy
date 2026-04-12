import { json, error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper, reference, job } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getVectorStore, getLlm, SummarySchema } from '$lib/server/llm';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { PDFParse } from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from '@sveltejs/kit';

const PROMPT_PATH = path.resolve('prompts', 'summarize_prompt.txt');

async function processUpload(jobId: string, userId: string, file: File, fileBuffer: ArrayBuffer) {
	try {
		// Extract text from PDF
		const buffer = Buffer.from(fileBuffer);
		const parser = new PDFParse({ data: buffer });
		const textResult = await parser.getText();
		const paperText = textResult.text;
		await parser.destroy();

		// Summarize
		const systemPrompt = await fs.readFile(PROMPT_PATH, 'utf-8');
		const llm = getLlm();
		const prompt = ChatPromptTemplate.fromMessages([
			['system', '{systemPrompt}'],
			['human', '{paperText}'],
		]);
		const chain = prompt.pipe(llm.withStructuredOutput(SummarySchema));
		const result = await chain.invoke({ systemPrompt, paperText });

		// Update job status to processing
		await db
			.update(job)
			.set({ status: 'processing' })
			.where(eq(job.id, jobId));

		// Save paper row (without references)
		const paperId = crypto.randomUUID();
		await db.insert(paper).values({
			id: paperId,
			userId,
			name: file.name,
			summary: result.summary,
			keyFindings: JSON.stringify(result.key_findings),
			methodology: result.methodology,
			limitations: result.limitations,
		});

		// Save references
		if (result.references.length > 0) {
			await db.insert(reference).values(
				result.references.map((text) => ({
					id: crypto.randomUUID(),
					paperId,
					text,
				}))
			);
		}

		// Vectorize — split and index
		const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
		const docs = await splitter.splitDocuments([
			new Document({ pageContent: paperText, metadata: { source: file.name, paperId } }),
		]);

		const vectorStore = await getVectorStore();
		await vectorStore.addDocuments(docs);
		await vectorStore.end();

		// Update job to done with paperId
		await db
			.update(job)
			.set({ status: 'done', paperId })
			.where(eq(job.id, jobId));
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		await db
			.update(job)
			.set({ status: 'failed', error: errorMessage })
			.where(eq(job.id, jobId));
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const session = await requireSession(request.headers);

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file || file.type !== 'application/pdf') error(400, 'PDF file required');

	// Create job row
	const jobId = crypto.randomUUID();
	await db.insert(job).values({
		id: jobId,
		userId: session.user.id,
		status: 'pending',
	});

	// Start processing in background (no await)
	const fileBuffer = await file.arrayBuffer();
	processUpload(jobId, session.user.id, file, fileBuffer).catch((err) => {
		console.error('Background upload failed:', err);
	});

	// Return immediately with job ID
	return json({ jobId });
};
