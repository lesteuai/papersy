import { env } from '$env/dynamic/private';

const DEFAULT_MAX_CHARS = 500_000;

// `Number(x) || default` would swallow MAX_CHARS=0, an empty string and typos like "500k", all
// of which fall back silently. Warn instead, so a misconfigured limit is visible in the logs.
function readMaxChars(): number {
	const raw = env.MAX_CHARS;
	if (raw === undefined || raw === '') return DEFAULT_MAX_CHARS;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		console.warn(`Ignoring invalid MAX_CHARS "${raw}"; using ${DEFAULT_MAX_CHARS}.`);
		return DEFAULT_MAX_CHARS;
	}
	return parsed;
}

export const MAX_CHARS = readMaxChars();

export function checkCharLimit(count: number): { ok: true } | { ok: false; message: string } {
	if (count <= MAX_CHARS) return { ok: true };
	return {
		ok: false,
		message: `Document has ${count} characters, which exceeds the ${MAX_CHARS} character limit.`
	};
}
