export const MAX_CHARS = 45_000;

export function checkCharLimit(count: number): { ok: true } | { ok: false; message: string } {
	if (count <= MAX_CHARS) return { ok: true };
	return {
		ok: false,
		message: `Document has ${count} characters, which exceeds the ${MAX_CHARS} character limit.`
	};
}
