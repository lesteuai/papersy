<script lang="ts">
	import type { ChatMessage } from '$lib/utils/types';
	import { marked } from 'marked';

	let { message }: { message: ChatMessage } = $props();
</script>

<div class="message" class:user={message.role === 'user'} class:ai={message.role === 'ai'}>
	<span class="label">{message.role === 'user' ? 'You' : 'AI'}</span>
	{#if message.loading}
		<p class="loading-dots">
			<span class="dot" style="animation-delay: 0ms;"></span>
			<span class="dot" style="animation-delay: 150ms;"></span>
			<span class="dot" style="animation-delay: 300ms;"></span>
		</p>
	{:else if message.role === 'ai'}
		<div class="markdown-content">{@html marked.parse(message.text)}</div>
	{:else}
		<p>{message.text}</p>
	{/if}
</div>

<style lang="scss">
	.message {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-width: 80%;

		&.user {
			align-self: flex-end;
			align-items: flex-end;

			p {
				background-color: var(--color--primary);
				color: var(--color--primary-contrast);
				border-radius: 16px 16px 4px 16px;
			}

			.label {
				color: var(--color--text-shade);
			}
		}

		&.ai {
			align-self: flex-start;
			align-items: flex-start;

			p {
				background-color: var(--color--card-background);
				color: var(--color--text);
				border-radius: 16px 16px 16px 4px;
				box-shadow: var(--card-shadow);
			}

			.label {
				color: var(--color--primary);
			}
		}

		.label {
			font-size: 0.75rem;
			font-weight: 600;
			padding: 0 4px;
		}

		p {
			margin: 0;
			padding: 10px 14px;
			font-size: 0.95rem;
			line-height: 1.55;
		}

		.loading-dots {
			display: flex;
			gap: 4px;
			align-items: center;
		}

		.dot {
			display: inline-block;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background-color: currentColor;
			opacity: 0.4;
			animation: dot-bounce 1.4s infinite;
		}

		@keyframes dot-bounce {
			0%,
			80%,
			100% {
				opacity: 0.4;
				transform: scale(1);
			}
			40% {
				opacity: 1;
				transform: scale(1.2);
			}
		}

		.markdown-content {
			margin: 0;
			padding: 10px 14px;
			font-size: 0.95rem;
			line-height: 1.55;
			background-color: var(--color--card-background);
			color: var(--color--text);
			border-radius: 16px 16px 16px 4px;
			box-shadow: var(--card-shadow);
			word-break: break-word;
		}

		// :global() is required because marked.parse() injects raw HTML via {@html},
		// which Svelte's scoped CSS cannot reach without escaping the component scope.
		.markdown-content :global(h1),
		.markdown-content :global(h2),
		.markdown-content :global(h3),
		.markdown-content :global(h4),
		.markdown-content :global(h5),
		.markdown-content :global(h6) {
			margin: 12px 0 8px 0;
			font-weight: 600;
			line-height: 1.4;
		}

		.markdown-content :global(h1) {
			font-size: 1.3rem;
		}

		.markdown-content :global(h2) {
			font-size: 1.15rem;
		}

		.markdown-content :global(h3) {
			font-size: 1.05rem;
		}

		.markdown-content :global(h4),
		.markdown-content :global(h5),
		.markdown-content :global(h6) {
			font-size: 0.95rem;
		}

		.markdown-content :global(p) {
			margin: 8px 0;
		}

		.markdown-content :global(ul),
		.markdown-content :global(ol) {
			margin: 8px 0;
			padding-left: 24px;
		}

		.markdown-content :global(li) {
			margin: 4px 0;
		}

		.markdown-content :global(code) {
			background-color: rgba(0, 0, 0, 0.1);
			padding: 2px 6px;
			border-radius: 3px;
			font-family: 'Ubuntu Mono', monospace;
			font-size: 0.9em;
		}

		.markdown-content :global(pre) {
			background-color: rgba(0, 0, 0, 0.08);
			border-radius: 6px;
			padding: 10px 12px;
			overflow-x: auto;
			margin: 8px 0;
		}

		.markdown-content :global(pre code) {
			background-color: transparent;
			padding: 0;
			border-radius: 0;
		}

		.markdown-content :global(blockquote) {
			margin: 8px 0;
			padding-left: 12px;
			border-left: 3px solid rgba(0, 0, 0, 0.2);
			font-style: italic;
		}

		.markdown-content :global(strong) {
			font-weight: 700;
		}

		.markdown-content :global(em) {
			font-style: italic;
		}

		.markdown-content :global(a) {
			color: var(--color--primary);
			text-decoration: underline;
		}

		.markdown-content :global(a:hover) {
			opacity: 0.8;
		}

		.markdown-content :global(hr) {
			border: none;
			height: 1px;
			background-color: rgba(0, 0, 0, 0.1);
			margin: 12px 0;
		}
	}
</style>
