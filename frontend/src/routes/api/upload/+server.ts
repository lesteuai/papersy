import { json, error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { paper, reference } from '$lib/server/db/schema';
import { getVectorStore, getLlm, SummarySchema } from '$lib/server/llm';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import pdf from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from '@sveltejs/kit';

const PROMPT_PATH = path.resolve('..', 'prompts', 'summarize_prompt.txt');

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Unauthorized');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file || file.type !== 'application/pdf') error(400, 'PDF file required');

	// Extract text from PDF
	const buffer = Buffer.from(await file.arrayBuffer());
	const pdfData = await pdf(buffer);
	const paperText = pdfData.text;

	// Summarize
	const systemPrompt = await fs.readFile(PROMPT_PATH, 'utf-8');
	const llm = getLlm();
	const prompt = ChatPromptTemplate.fromMessages([
		['system', '{systemPrompt}'],
		['human', '{paperText}'],
	]);
	const chain = prompt.pipe(llm.withStructuredOutput(SummarySchema));
	const result = await chain.invoke({ systemPrompt, paperText });

	// Save paper row (without references)
	const paperId = crypto.randomUUID();
	await db.insert(paper).values({
		id: paperId,
		userId: session.user.id,
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

	return json({
		id: paperId,
		name: file.name,
		summary: result.summary,
		keyFindings: result.key_findings,
		methodology: result.methodology,
		limitations: result.limitations,
		references: result.references,
	});
};
