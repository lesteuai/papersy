<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="auth-wrapper">
	<div class="auth-card">
		<h1>{title}</h1>
		{@render children()}
	</div>
</div>

<style lang="scss">
	.auth-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 85px);
		padding: 20px;
	}

	.auth-card {
		background: var(--color--card-background);
		box-shadow: var(--card-shadow);
		border-radius: 12px;
		padding: 40px;
		width: 100%;
		max-width: 400px;

		h1 {
			font-size: 2rem;
			text-align: center;
			margin-bottom: 30px;
			color: var(--color--primary);
		}
	}

	:global(.auth-card .field) {
		display: flex;
		flex-direction: column;
		gap: 6px;

		label {
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--color--text-shade);
		}

		input {
			padding: 10px 14px;
			border: 1px solid rgba(var(--color--text-rgb), 0.2);
			border-radius: 8px;
			font: inherit;
			font-size: 1rem;
			background: var(--color--page-background);
			color: var(--color--text);
			transition: border-color 0.2s;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
			}

			&:disabled {
				opacity: 0.6;
			}
		}
	}

	:global(.auth-card .submit-row) {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	:global(.auth-card .footer-section) {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	:global(.auth-card .error) {
		font-size: 0.875rem;
		color: #e53e3e;
		margin: 0 0 20px 0;
		padding: 12px 14px;
		background: rgba(229, 62, 62, 0.1);
		border: 1px solid rgba(229, 62, 62, 0.2);
		border-radius: 8px;
	}

	:global(.auth-card .success) {
		font-size: 0.875rem;
		color: #22863a;
		margin: 0 0 20px 0;
		padding: 12px 14px;
		background: rgba(34, 134, 58, 0.1);
		border: 1px solid rgba(34, 134, 58, 0.2);
		border-radius: 8px;
	}
</style>
