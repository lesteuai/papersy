import { eq } from 'drizzle-orm';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { db } from './db';
import { document, documentChunk } from './db/schema';
import { getEmbeddings, checkEmbeddingHealth } from './llm';
import { activeIngestions } from './ingest-jobs';
import { JobStatus } from '$lib/utils/types';

class AbortedError extends Error {
	constructor() {
		super('Ingestion aborted');
		this.name = 'AbortedError';
	}
}

function throwIfAborted(signal: AbortSignal) {
	if (signal.aborted) throw new AbortedError();
}

function setStatus(documentId: string, status: JobStatus, error?: string) {
	return db
		.update(document)
		.set({ status, error: error ?? null })
		.where(eq(document.id, documentId));
}

// Extraction and the 45,000-char limit check happen in the route before a document row
// is created (AC-19: an oversized document never gets a row). This function assumes the
// document row already exists and takes the already-extracted text, not a raw buffer.
export async function ingestDocument(
	documentId: string,
	projectId: string,
	userId: string,
	text: string,
	signal: AbortSignal
): Promise<void> {
	try {
		await setStatus(documentId, JobStatus.Processing);
		throwIfAborted(signal);

		const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
		const chunks = await splitter.splitText(text);
		throwIfAborted(signal);

		await setStatus(documentId, JobStatus.Storing);
		throwIfAborted(signal);

		const healthy = await checkEmbeddingHealth();
		if (!healthy) {
			throw new Error('Embedding service is unreachable, so the document could not be indexed.');
		}
		throwIfAborted(signal);

		const vectors = await getEmbeddings().embedDocuments(chunks);
		throwIfAborted(signal);

		await db.insert(documentChunk).values(
			chunks.map((content, chunkIndex) => ({
				id: crypto.randomUUID(),
				documentId,
				projectId,
				userId,
				content,
				chunkIndex,
				embedding: vectors[chunkIndex]
			}))
		);
		throwIfAborted(signal);

		await setStatus(documentId, JobStatus.Done);
	} catch (err) {
		if (err instanceof AbortedError) {
			await setStatus(documentId, JobStatus.Cancelled);
		} else {
			const message = err instanceof Error ? err.message : 'Ingestion failed for an unknown reason.';
			await setStatus(documentId, JobStatus.Failed, message);
		}
	} finally {
		activeIngestions.delete(documentId);
	}
}
