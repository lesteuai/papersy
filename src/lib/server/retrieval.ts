import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getEmbeddings } from '$lib/server/llm';
import { fuseRrf } from './rrf';

// Per-arm candidate depth before fusion narrows down to the top results.
export const CANDIDATE_DEPTH = 20;

async function searchVector(projectId: string, userId: string, queryEmbedding: number[]): Promise<string[]> {
	const vectorLiteral = JSON.stringify(queryEmbedding);
	const result = await db.execute(sql`
		SELECT id FROM document_chunk
		WHERE project_id = ${projectId} AND user_id = ${userId}
		ORDER BY embedding <=> ${vectorLiteral}::vector LIMIT ${CANDIDATE_DEPTH}
	`);
	return result.map((row) => row.id as string);
}

async function searchFullText(projectId: string, userId: string, queryText: string): Promise<string[]> {
	const result = await db.execute(sql`
		SELECT id FROM document_chunk, plainto_tsquery('english', ${queryText}) q
		WHERE project_id = ${projectId} AND user_id = ${userId} AND tsv @@ q
		ORDER BY ts_rank_cd(tsv, q) DESC LIMIT ${CANDIDATE_DEPTH}
	`);
	return result.map((row) => row.id as string);
}

export type RetrievedChunk = { id: string; content: string; source: string };

export async function hybridSearch(
	projectId: string,
	userId: string,
	query: string
): Promise<RetrievedChunk[]> {
	const queryEmbedding = await getEmbeddings().embedQuery(query);

	const [vectorIds, fullTextIds] = await Promise.all([
		searchVector(projectId, userId, queryEmbedding),
		searchFullText(projectId, userId, query)
	]);

	const fusedIds = fuseRrf([vectorIds, fullTextIds]);
	if (fusedIds.length === 0) return [];

	const idList = sql.join(
		fusedIds.map((id) => sql`${id}`),
		sql`, `
	);
	const rows = await db.execute(sql`
		SELECT document_chunk.id AS id, document_chunk.content AS content, document.name AS source
		FROM document_chunk
		JOIN document ON document.id = document_chunk.document_id
		WHERE document_chunk.id IN (${idList})
	`);

	const byId = new Map(rows.map((row) => [row.id as string, row as unknown as RetrievedChunk]));
	return fusedIds
		.map((id) => byId.get(id))
		.filter((chunk): chunk is RetrievedChunk => chunk !== undefined);
}
