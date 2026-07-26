import { describe, it, expect } from 'vitest';
import { extractDocument, UnsupportedTypeError, EmptyExtractionError } from './extract';

describe('extractDocument', () => {
	it('extracts markdown files as kind "markdown"', async () => {
		const buffer = Buffer.from('# Hello\n\nSome content here.', 'utf-8');

		const result = await extractDocument(buffer, 'notes.md');

		expect(result.kind).toBe('markdown');
		expect(result.text).toContain('Hello');
	});

	it('extracts .markdown files as kind "markdown"', async () => {
		const buffer = Buffer.from('# Title\n\nBody text.', 'utf-8');

		const result = await extractDocument(buffer, 'notes.markdown');

		expect(result.kind).toBe('markdown');
		expect(result.text).toContain('Title');
	});

	it('extracts plain text files as kind "text"', async () => {
		const buffer = Buffer.from('Plain text content for testing.', 'utf-8');

		const result = await extractDocument(buffer, 'readme.txt');

		expect(result.kind).toBe('text');
		expect(result.text).toContain('Plain text content for testing.');
	});

	it('rejects unsupported file extensions naming the accepted types', async () => {
		const buffer = Buffer.from('irrelevant content', 'utf-8');

		await expect(extractDocument(buffer, 'image.png')).rejects.toThrow(UnsupportedTypeError);
		await expect(extractDocument(buffer, 'image.png')).rejects.toThrow(
			/\.pdf.*\.md.*\.markdown.*\.txt/
		);
	});

	it('rejects an invalid PDF byte string with EmptyExtractionError', async () => {
		const buffer = Buffer.from('this is not a real pdf file', 'utf-8');

		await expect(extractDocument(buffer, 'fake.pdf')).rejects.toThrow(EmptyExtractionError);
	});

	it('rejects blank text content as empty extraction', async () => {
		const buffer = Buffer.from('   \n\t  ', 'utf-8');

		await expect(extractDocument(buffer, 'blank.txt')).rejects.toThrow(EmptyExtractionError);
	});
});
