<script lang="ts">
	import type { ChatMessage } from './types';

	let { message }: { message: ChatMessage } = $props();
</script>

<div class="message" class:user={message.role === 'user'} class:ai={message.role === 'ai'}>
	<span class="label">{message.role === 'user' ? 'You' : 'AI'}</span>
	<p>{message.text}</p>
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
	}
</style>
