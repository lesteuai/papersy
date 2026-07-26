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

// plainto_tsquery joins terms with AND, so a chunk only matches when it contains every
// term of the question. That makes the full-text arm return nothing for most natural
// questions and quietly reduces hybrid search to vector-only. Swapping the operators to
// OR lets a chunk carrying the one distinguishing term compete. plainto_tsquery still
// does the parsing and sanitising, so the rewritten text is safe to cast back.
async function searchFullText(projectId: string, userId: string, queryText: string): Promise<string[]> {
	const result = await db.execute(sql`
		WITH q AS (
			SELECT replace(plainto_tsquery('english', ${queryText})::text, '&', '|')::tsquery AS query
		)
		SELECT document_chunk.id FROM document_chunk, q
		WHERE project_id = ${projectId} AND user_id = ${userId} AND tsv @@ q.query
		ORDER BY ts_rank_cd(tsv, q.query) DESC LIMIT ${CANDIDATE_DEPTH}
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
