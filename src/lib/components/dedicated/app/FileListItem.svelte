<script lang="ts">
	import type { PapersyFile } from '$lib/utils/types';

	let {
		file,
		selected = false,
		onSelect,
		onDelete
	}: {
		file: PapersyFile;
		selected?: boolean;
		onSelect: (id: string) => void;
		onDelete: (id: string) => void;
	} = $props();

	let menuOpen = $state(false);

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.menu-wrapper')) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="file-item" class:selected>
	<button class="file-name" onclick={() => onSelect(file.id)}>
		{file.name}
		{#if file.jobStatus === 'pending' || file.jobStatus === 'processing'}
			<span class="spinner" aria-label="Processing"></span>
		{/if}
	</button>
	<div class="menu-wrapper">
		<button class="menu-trigger" onclick={() => menuOpen = !menuOpen} aria-label="File options">
			[...]
		</button>
		{#if menuOpen}
			<div class="menu">
				<button onclick={() => { onDelete(file.id); menuOpen = false; }}>Delete</button>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.file-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: 6px;
		transition: background-color 0.15s;

		&:hover {
			background-color: rgba(var(--color--primary-rgb), 0.06);
		}

		&.selected {
			background-color: rgba(var(--color--primary-rgb), 0.12);

			.file-name {
				color: var(--color--primary);
				font-weight: 600;
			}
		}
	}

	.file-name {
		flex: 1;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		color: var(--color--text);
		text-align: left;
		padding: 6px 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.spinner {
		display: inline-block;
		width: 10px;
		height: 10px;
		border: 2px solid rgba(var(--color--text-rgb), 0.2);
		border-top-color: var(--color--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.menu-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.menu-trigger {
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color--text-shade);
		padding: 4px 6px;
		border-radius: 4px;
		line-height: 1;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.1);
		}
	}

	.menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		background-color: var(--color--card-background);
		border-radius: 8px;
		box-shadow: var(--card-shadow);
		padding: 4px;
		min-width: 100px;
		z-index: 10;

		button {
			display: block;
			width: 100%;
			background: none;
			border: none;
			cursor: pointer;
			font: inherit;
			font-size: 0.9rem;
			color: var(--color--text);
			text-align: left;
			padding: 8px 12px;
			border-radius: 4px;

			&:hover {
				background-color: rgba(var(--color--text-rgb), 0.08);
				color: #f95256;
			}
		}
	}
</style>
