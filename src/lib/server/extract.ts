import { MarkItDown } from 'markitdown-ts';
import "@napi-rs/canvas";

const ACCEPTED_EXTENSIONS = ['.pdf', '.md', '.markdown', '.txt'] as const;

type ExtractKind = 'pdf' | 'markdown' | 'text';

const EXTENSION_KIND: Record<(typeof ACCEPTED_EXTENSIONS)[number], ExtractKind> = {
	'.pdf': 'pdf',
	'.md': 'markdown',
	'.markdown': 'markdown',
	'.txt': 'text'
};

export class UnsupportedTypeError extends Error {
	constructor(filename: string) {
		super(`Unsupported file type for "${filename}". Accepted types: .pdf, .md, .markdown, .txt`);
		this.name = 'UnsupportedTypeError';
	}
}

export class EmptyExtractionError extends Error {
	constructor(filename: string) {
		super(`No extractable text found in "${filename}". The file may be a scanned image or corrupt.`);
		this.name = 'EmptyExtractionError';
	}
}

function getExtension(filename: string): (typeof ACCEPTED_EXTENSIONS)[number] {
	const match = ACCEPTED_EXTENSIONS.find((ext) => filename.toLowerCase().endsWith(ext));
	if (!match) throw new UnsupportedTypeError(filename);
	return match;
}

export async function extractDocument(
	buffer: Buffer,
	filename: string
): Promise<{ kind: ExtractKind; text: string }> {
	const extension = getExtension(filename);

	let result;
	try {
		const markItDown = new MarkItDown();
		result = await markItDown.convertBuffer(buffer, { file_extension: extension });
	} catch {
		// Corrupt or unparseable files (e.g. malformed PDF) throw rather than
		// returning null, but both cases mean there is nothing extractable.
		throw new EmptyExtractionError(filename);
	}

	if (!result || !result.markdown || result.markdown.trim().length === 0) {
		throw new EmptyExtractionError(filename);
	}

	// Remove page footer
	result.markdown = result.markdown.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '');

	return { kind: EXTENSION_KIND[extension], text: result.markdown };
}
