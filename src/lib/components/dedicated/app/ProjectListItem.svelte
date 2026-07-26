<script lang="ts">
	import type { Project } from '$lib/utils/types';

	let {
		project,
		selected,
		onSelect,
		onRenameRequest,
		onDelete
	}: {
		project: Project;
		selected: boolean;
		onSelect: (id: string) => void;
		onRenameRequest: (id: string) => void;
		onDelete: (id: string) => void;
	} = $props();

	let menuOpen = $state(false);
	let menuPosition = $state({ top: 0, left: 0 });

	function handleToggleMenu(e: MouseEvent) {
		e.stopPropagation();
		if (!menuOpen) {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			menuPosition = { top: rect.bottom, left: rect.right };
		}
		menuOpen = !menuOpen;
	}

	function handleRename(e: MouseEvent) {
		e.stopPropagation();
		menuOpen = false;
		onRenameRequest(project.id);
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		menuOpen = false;
		onDelete(project.id);
	}

	function handleWindowClick() {
		menuOpen = false;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="project-item" class:selected>
	<button class="project-name" onclick={() => onSelect(project.id)}>
		{project.name}
	</button>
	<div class="menu-wrapper">
		<button class="menu-toggle" onclick={handleToggleMenu} aria-label="Project actions">
			&hellip;
		</button>
		{#if menuOpen}
			<div class="menu" style:top="{menuPosition.top}px" style:left="{menuPosition.left}px">
				<button class="menu-item" onclick={handleRename}>Rename</button>
				<button class="menu-item danger" onclick={handleDelete}>Delete</button>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.project-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 8px;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.05);

			.menu-toggle {
				opacity: 1;
			}
		}

		&.selected {
			background-color: rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.project-name {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		padding: 10px 4px;
		font: inherit;
		color: var(--color--text);
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-wrapper {
		position: relative;
	}

	.menu-toggle {
		background: none;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 6px 8px;
		font-size: 1rem;
		line-height: 1;
		opacity: 0;
		transition: opacity 0.2s;

		&:focus-visible {
			opacity: 1;
			outline: none;
		}
	}

	.menu {
		position: fixed;
		transform: translateX(-100%);
		z-index: 10;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 8px;
		box-shadow: var(--card-shadow);
		min-width: 120px;
		display: flex;
		flex-direction: column;
		padding: 4px;
	}

	.menu-item {
		background: none;
		border: none;
		text-align: left;
		padding: 8px 10px;
		font: inherit;
		font-size: 0.875rem;
		color: var(--color--text);
		cursor: pointer;
		border-radius: 6px;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.08);
		}

		&.danger {
			color: #e53e3e;
		}
	}
</style>
