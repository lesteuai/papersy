<script lang="ts">
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';
	import type { ChatMessage } from '$lib/utils/types';

	let { messages, onSend }: { messages: ChatMessage[]; onSend: (text: string) => void } = $props();

	let listEl: HTMLDivElement;

	let awaitingReply = $derived(messages.some((message) => message.loading));

	$effect(() => {
		// scroll to bottom whenever messages change. message; so it keeps track of changes of that variable
		// eslint-disable-next-line
		messages;
		if (listEl) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});
</script>

<div class="chat-view-wrapper">
	<div class="chat-view" bind:this={listEl}>
		{#if messages.length === 0}
			<div class="empty-hint">
				<p>Ask a question about the documents in this project.</p>
			</div>
		{/if}
		{#each messages as message, idx (idx)}
			<ChatMessageComponent {message} />
		{/each}
	</div>
	<ChatInput {onSend} disabled={awaitingReply} />
</div>

<style lang="scss">
	.chat-view-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.chat-view {
		flex: 1;
		overflow-y: auto;
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.empty-hint {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;

		p {
			font-size: 0.9rem;
			color: var(--color--text-shade);
		}
	}
</style>
