<script lang="ts">
	import ChatMessageComponent from './ChatMessage.svelte';
	import type { ChatMessage } from './types';

	let { messages }: { messages: ChatMessage[] } = $props();

	let listEl: HTMLDivElement;

	$effect(() => {
		// scroll to bottom whenever messages change
		messages;
		if (listEl) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});
</script>

<div class="chat-view" bind:this={listEl}>
	{#if messages.length === 0}
		<div class="empty-hint">
			<p>Ask a question about this paper.</p>
		</div>
	{/if}
	{#each messages as message (message.role + message.text)}
		<ChatMessageComponent {message} />
	{/each}
</div>

<style lang="scss">
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
