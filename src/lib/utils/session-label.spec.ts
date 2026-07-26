import { describe, it, expect } from 'vitest';
import { sessionLabel, validateName } from './session-label';

describe('sessionLabel', () => {
	it('returns the name when set', () => {
		expect(sessionLabel('My Session', 'hello')).toBe('My Session');
	});

	it('returns the first user message when no name is set and it fits within 60 characters', () => {
		expect(sessionLabel(null, 'What is the summary of this paper?')).toBe(
			'What is the summary of this paper?'
		);
	});

	it('truncates the first user message to 60 characters with an ellipsis', () => {
		const longMessage = 'a'.repeat(80);

		const result = sessionLabel(null, longMessage);

		expect(result).toBe(`${'a'.repeat(60)}...`);
	});

	it('returns the placeholder label when there is no name and no message', () => {
		expect(sessionLabel(null)).toBe('New chat');
	});
});

describe('validateName', () => {
	it('rejects a whitespace-only name', () => {
		const result = validateName('   ');

		expect(result.ok).toBe(false);
	});

	it('rejects a name over 100 characters', () => {
		const result = validateName('a'.repeat(101));

		expect(result.ok).toBe(false);
	});

	it('accepts and trims a valid name', () => {
		const result = validateName('  My Project  ');

		expect(result).toEqual({ ok: true, value: 'My Project' });
	});
});
