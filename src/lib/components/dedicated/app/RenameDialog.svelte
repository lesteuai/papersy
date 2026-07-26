<script lang="ts">
	import { validateName } from '$lib/utils/session-label';

	let {
		open,
		currentValue,
		title = 'Rename',
		onSubmit,
		onCancel
	}: {
		open: boolean;
		currentValue: string;
		title?: string;
		onSubmit: (name: string) => void;
		onCancel: () => void;
	} = $props();

	let value = $state('');
	let error = $state<string | null>(null);
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (open) {
			value = currentValue;
			error = null;
			inputEl?.focus();
		}
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const result = validateName(value);
		if (!result.ok) {
			error = result.message;
			return;
		}
		error = null;
		onSubmit(result.value);
	}

	function handleCancel() {
		error = null;
		onCancel();
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleCancel();
	}
</script>

{#if open}
	<div class="overlay" role="presentation" onclick={handleCancel} onkeydown={handleOverlayKeydown}>
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2>{title}</h2>
			<form onsubmit={handleSubmit}>
				<input type="text" bind:value bind:this={inputEl} />
				{#if error}
					<p class="error">{error}</p>
				{/if}
				<div class="actions">
					<button type="button" class="cancel-btn" onclick={handleCancel}>Cancel</button>
					<button type="submit" class="submit-btn">Save</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style lang="scss">
	.overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.dialog {
		background: var(--color--card-background);
		border-radius: 12px;
		padding: 24px;
		width: 100%;
		max-width: 360px;
		box-shadow: var(--card-shadow);

		h2 {
			margin: 0 0 16px;
			font-size: 1.15rem;
			color: var(--color--text);
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
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
	}

	.error {
		font-size: 0.875rem;
		color: #e53e3e;
		margin: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.cancel-btn,
	.submit-btn {
		padding: 8px 16px;
		border-radius: 20px;
		border: none;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.85;
		}
	}

	.cancel-btn {
		background: none;
		color: var(--color--text-shade);
	}

	.submit-btn {
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
	}
</style>
