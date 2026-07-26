import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatMessage from './ChatMessage.svelte';
import type { ChatMessage as ChatMessageType } from '$lib/utils/types';

describe('ChatMessage.svelte', () => {
	it('neutralizes active-content payloads in assistant messages', async () => {
		const message: ChatMessageType = {
			role: 'assistant',
			text: [
				'<script>alert(1)</script>',
				'<img src="x" onerror="alert(1)">',
				'<iframe src="https://evil.example"></iframe>',
				'[click](javascript:alert(1))'
			].join('\n\n')
		};

		const { container } = render(ChatMessage, { message });

		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('iframe')).toBeNull();
		expect(container.querySelector('[onerror]')).toBeNull();

		const anchors = Array.from(container.querySelectorAll('a'));
		const hasJavascriptHref = anchors.some((anchor) =>
			(anchor.getAttribute('href') ?? '').startsWith('javascript:')
		);
		expect(hasJavascriptHref).toBe(false);
	});

	it('still renders ordinary markdown formatting for assistant messages', async () => {
		const message: ChatMessageType = {
			role: 'assistant',
			text: [
				'## Heading',
				'',
				'- one',
				'- two',
				'',
				'```js',
				'const x = 1;',
				'```',
				'',
				'**bold text**',
				'',
				'[link](https://example.com)'
			].join('\n')
		};

		const { container } = render(ChatMessage, { message });

		expect(container.querySelector('h2')).not.toBeNull();
		expect(container.querySelector('ul')).not.toBeNull();
		expect(container.querySelector('li')).not.toBeNull();
		expect(container.querySelector('pre code')).not.toBeNull();
		expect(container.querySelector('strong')).not.toBeNull();

		const anchors = Array.from(container.querySelectorAll('a'));
		const hasHttpsHref = anchors.some((anchor) =>
			(anchor.getAttribute('href') ?? '').startsWith('https')
		);
		expect(hasHttpsHref).toBe(true);
	});

	it('renders user messages as plain text, not markdown HTML', async () => {
		const message: ChatMessageType = {
			role: 'user',
			text: '## Not a heading\n\n<strong>not bold</strong>'
		};

		const { container } = render(ChatMessage, { message });

		expect(container.querySelector('.markdown-content')).toBeNull();
		expect(container.querySelector('h2')).toBeNull();
		expect(container.querySelector('strong')).toBeNull();
		expect(container.textContent).toContain('## Not a heading');
	});
});
