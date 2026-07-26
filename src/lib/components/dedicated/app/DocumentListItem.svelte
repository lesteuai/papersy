<script lang="ts">
	import { JobStatus } from '$lib/utils/types';
	import type { Document } from '$lib/utils/types';
	import CheckIcon from '$lib/icons/check.svelte';
	import AlertIcon from '$lib/icons/alert.svelte';
	import CircleIcon from '$lib/icons/circle.svelte';

	let {
		document,
		onDelete
	}: {
		document: Document;
		onDelete: (id: string) => void;
	} = $props();

	const inProgress = $derived(
		document.status === JobStatus.Pending ||
			document.status === JobStatus.Processing ||
			document.status === JobStatus.Storing
	);
	const failed = $derived(document.status === JobStatus.Failed);

	function handleDelete() {
		onDelete(document.id);
	}
</script>

<div class="document-item" class:failed>
	<div class="status-icon" class:spinning={inProgress}>
		{#if failed}
			<AlertIcon />
		{:else if document.status === JobStatus.Done}
			<CheckIcon />
		{:else}
			<CircleIcon />
		{/if}
	</div>
	<div class="document-info">
		<span class="document-name">{document.name}</span>
		<span class="document-status">{document.status}</span>
		{#if failed && document.error}
			<span class="document-error">{document.error}</span>
		{/if}
	</div>
	<button class="delete-btn" onclick={handleDelete} aria-label="Delete document">&times;</button>
</div>

<style lang="scss">
	.document-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px;
		border-radius: 8px;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.05);
		}

		&.failed {
			.document-status {
				color: #e53e3e;
			}
		}
	}

	.status-icon {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		margin-top: 2px;
		color: var(--color--text-shade);

		&.spinning {
			color: var(--color--primary);
			animation: spin 1s linear infinite;
		}
	}

	.document-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.document-name {
		font-size: 0.9rem;
		color: var(--color--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.document-status {
		font-size: 0.75rem;
		color: var(--color--text-shade);
		text-transform: capitalize;
	}

	.document-error {
		font-size: 0.75rem;
		color: #e53e3e;
	}

	.delete-btn {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 4px 6px;

		&:hover {
			color: #e53e3e;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
