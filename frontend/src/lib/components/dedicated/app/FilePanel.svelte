<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FileListItem from './FileListItem.svelte';
	import type { PapersyFile } from './types';

	let {
		files,
		selectedFileId,
		onUpload,
		onSelect,
		onDelete
	}: {
		files: PapersyFile[];
		selectedFileId: string | null;
		onUpload: (file: File) => void;
		onSelect: (id: string) => void;
		onDelete: (id: string) => void;
	} = $props();

	let fileInput: HTMLInputElement;

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			onUpload(file);
			input.value = '';
		}
	}
</script>

<div class="file-panel">
	<div class="panel-header">
		<input
			bind:this={fileInput}
			type="file"
			accept=".pdf"
			class="hidden-input"
			onchange={handleFileChange}
		/>
		<Button style="understated" size="small" onclick={() => fileInput.click()}>
			Upload
		</Button>
	</div>

	<div class="file-list">
		{#each files as file (file.id)}
			<FileListItem
				{file}
				selected={file.id === selectedFileId}
				{onSelect}
				{onDelete}
			/>
		{/each}

		{#if files.length === 0}
			<p class="empty-hint">No files yet. Upload a PDF to get started.</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.file-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-right: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.panel-header {
		padding: 12px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.hidden-input {
		display: none;
	}

	.file-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.empty-hint {
		font-size: 0.85rem;
		color: var(--color--text-shade);
		text-align: center;
		padding: 20px 10px;
		line-height: 1.5;
	}
</style>
