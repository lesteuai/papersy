import { describe, it, expect } from 'vitest';
import { checkCharLimit, MAX_CHARS } from './limits';

describe('checkCharLimit', () => {
	it('accepts a count exactly at the limit', () => {
		expect(checkCharLimit(MAX_CHARS)).toEqual({ ok: true });
	});

	it('rejects a count one over the limit, naming both the count and the limit', () => {
		const result = checkCharLimit(MAX_CHARS + 1);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain(String(MAX_CHARS + 1));
			expect(result.message).toContain(String(MAX_CHARS));
		}
	});

	it('accepts a small count', () => {
		expect(checkCharLimit(0)).toEqual({ ok: true });
	});
});
