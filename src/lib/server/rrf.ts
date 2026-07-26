// Reciprocal Rank Fusion: combine multiple ranked id lists into one ranking.
// Score of an id is the sum of 1 / (k + rank) over every list containing it,
// using one-based ranks (the first item in a list has rank 1).
export const RRF_K = 60;
export const RRF_DEFAULT_LIMIT = 5;

export function fuseRrf(lists: string[][], opts?: { k?: number; limit?: number }): string[] {
	const k = opts?.k ?? RRF_K;
	const limit = opts?.limit ?? RRF_DEFAULT_LIMIT;

	const scores = new Map<string, number>();
	for (const list of lists) {
		list.forEach((id, index) => {
			const rank = index + 1;
			const previous = scores.get(id) ?? 0;
			scores.set(id, previous + 1 / (k + rank));
		});
	}

	return [...scores.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([id]) => id);
}
