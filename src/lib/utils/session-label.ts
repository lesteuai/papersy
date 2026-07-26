const AUTO_LABEL_MAX_LENGTH = 60;
const PLACEHOLDER_LABEL = 'New chat';

export function sessionLabel(name: string | null, firstUserMessage?: string): string {
	if (name) return name;
	if (firstUserMessage) {
		if (firstUserMessage.length <= AUTO_LABEL_MAX_LENGTH) return firstUserMessage;
		return `${firstUserMessage.slice(0, AUTO_LABEL_MAX_LENGTH)}...`;
	}
	return PLACEHOLDER_LABEL;
}

export function validateName(raw: string): { ok: true; value: string } | { ok: false; message: string } {
	const trimmed = raw.trim();
	if (trimmed.length < 1 || trimmed.length > 100) {
		return { ok: false, message: 'Name must be between 1 and 100 characters.' };
	}
	return { ok: true, value: trimmed };
}
