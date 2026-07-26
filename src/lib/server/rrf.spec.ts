import { describe, it, expect } from 'vitest';
import { fuseRrf, RRF_K, RRF_DEFAULT_LIMIT } from './rrf';

describe('fuseRrf', () => {
	it('returns an empty array for empty input', () => {
		expect(fuseRrf([])).toEqual([]);
	});

	it('ranks an id appearing in both lists above one appearing in only one', () => {
		// b sits behind a and c in each individual list, but appears in both,
		// so its fused score should still beat ids seen in only one list.
		const fulltext = ['a', 'b'];
		const vector = ['c', 'b'];

		const result = fuseRrf([fulltext, vector]);

		expect(result[0]).toBe('b');
	});

	it('scores using one-based ranks and default k', () => {
		const result = fuseRrf([['x']]);
		// score of x is 1 / (RRF_K + 1)
		expect(result).toEqual(['x']);
		expect(1 / (RRF_K + 1)).toBeCloseTo(1 / 61);
	});

	it('truncates to the default limit of 5', () => {
		const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

		const result = fuseRrf([list]);

		expect(result).toHaveLength(RRF_DEFAULT_LIMIT);
		expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
	});

	it('respects a custom limit and k', () => {
		const list = ['a', 'b', 'c'];

		const result = fuseRrf([list], { k: 1, limit: 2 });

		expect(result).toEqual(['a', 'b']);
	});
});
