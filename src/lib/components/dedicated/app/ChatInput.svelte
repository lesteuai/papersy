<script lang="ts">
	import SendIcon from '$lib/icons/send.svelte';

	let {
		onSend,
		disabled = false
	}: {
		onSend: (text: string) => void;
		disabled?: boolean;
	} = $props();

	let text = $state('');

	function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed) return;
		onSend(trimmed);
		text = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="chat-input" class:disabled>
	<textarea
		bind:value={text}
		placeholder="Chat box for Q&A the paper"
		rows="1"
		onkeydown={handleKeydown}
		disabled={disabled}
	></textarea>
	<button class="send-btn" onclick={handleSubmit} aria-label="Send message" disabled={disabled || !text.trim()}>
		<SendIcon />
	</button>
</div>

<style lang="scss">
	.chat-input {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
		background-color: var(--color--card-background);
	}

	textarea {
		flex: 1;
		padding: 10px 14px;
		border: 1px solid rgba(var(--color--text-rgb), 0.2);
		border-radius: 20px;
		font: inherit;
		font-size: 0.95rem;
		background: var(--color--page-background);
		color: var(--color--text);
		resize: none;
		line-height: 1.5;
		max-height: 120px;
		overflow-y: auto;
		transition: border-color 0.2s;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.send-btn {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		border: none;
		border-radius: 50%;
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		transition: opacity 0.2s;

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&:not(:disabled):hover {
			opacity: 0.85;
		}
	}

	.chat-input.disabled {
		pointer-events: none;
	}
</style>
