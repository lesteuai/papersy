<script lang="ts">
	import type { Project } from '$lib/utils/types';
	import { validateName } from '$lib/utils/session-label';
	import ProjectListItem from '$lib/components/dedicated/app/ProjectListItem.svelte';
	import RenameDialog from '$lib/components/dedicated/app/RenameDialog.svelte';

	let {
		projects,
		selectedId = null,
		onCreate,
		onSelect,
		onRename,
		onDelete
	}: {
		projects: Project[];
		selectedId?: string | null;
		onCreate: (name: string) => void;
		onSelect: (id: string) => void;
		onRename: (id: string, name: string) => void;
		onDelete: (id: string) => void;
	} = $props();

	let newProjectName = $state('');
	let createError = $state<string | null>(null);
	let renamingProject = $state<Project | null>(null);

	function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const result = validateName(newProjectName);
		if (!result.ok) {
			createError = result.message;
			return;
		}
		createError = null;
		onCreate(result.value);
		newProjectName = '';
	}

	function handleRenameRequest(id: string) {
		renamingProject = projects.find((project) => project.id === id) ?? null;
	}

	function handleRenameSubmit(name: string) {
		if (renamingProject) onRename(renamingProject.id, name);
		renamingProject = null;
	}

	function handleRenameCancel() {
		renamingProject = null;
	}
</script>

<div class="project-list">
	<div class="header">
		<h2>Projects</h2>
	</div>
	<form class="create-form" onsubmit={handleCreate}>
		<input type="text" bind:value={newProjectName} placeholder="New project name" />
		<button type="submit" class="create-btn" aria-label="Create project">+</button>
	</form>
	{#if createError}
		<p class="error">{createError}</p>
	{/if}
	<div class="list">
		{#each projects as project (project.id)}
			<ProjectListItem
				{project}
				selected={project.id === selectedId}
				{onSelect}
				onRenameRequest={handleRenameRequest}
				{onDelete}
			/>
		{/each}
	</div>
</div>

<RenameDialog
	open={renamingProject !== null}
	currentValue={renamingProject?.name ?? ''}
	title="Rename project"
	onSubmit={handleRenameSubmit}
	onCancel={handleRenameCancel}
/>

<style lang="scss">
	.project-list {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--color--card-background);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

		h2 {
			margin: 0;
			font-size: 1rem;
			color: var(--color--text);
		}
	}

	.create-form {
		display: flex;
		gap: 8px;
		padding: 12px 16px;
	}

	input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid rgba(var(--color--text-rgb), 0.2);
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		background: var(--color--page-background);
		color: var(--color--text);
		transition: border-color 0.2s;

		&:focus {
			outline: none;
			border-color: var(--color--primary);
		}
	}

	.create-btn {
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border: none;
		border-radius: 50%;
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.85;
		}
	}

	.error {
		margin: 0 16px 8px;
		font-size: 0.8rem;
		color: #e53e3e;
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 4px 8px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
