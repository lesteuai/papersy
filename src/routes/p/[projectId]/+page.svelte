<script lang="ts">
	import { getContext } from 'svelte';

	const createSession = getContext<() => Promise<void>>('createSession');

	async function handleNewChat() {
		await createSession();
	}
</script>

<div class="empty-state">
	<p>Select a chat, or start a new one.</p>
	<button class="new-chat-btn" onclick={handleNewChat}>New chat</button>
</div>

<style lang="scss">
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;

		p {
			color: var(--color--text-shade);
			margin: 0;
		}
	}

	.new-chat-btn {
		border: none;
		border-radius: 8px;
		padding: 10px 20px;
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
		font: inherit;
		font-size: 0.95rem;
		cursor: pointer;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.85;
		}
	}
</style>
