<script lang="ts">
	import { JobStatus } from '$lib/utils/types';
	import type { Document } from '$lib/utils/types';
	import DocumentListItem from './DocumentListItem.svelte';

	let {
		projectId
	}: {
		projectId: string;
	} = $props();

	let documents = $state<Document[]>([]);
	let uploading = $state(false);
	let uploadError = $state('');
	let pollTimer: ReturnType<typeof setTimeout> | null = null;

	const ACCEPTED_TYPES = '.pdf,.md,.markdown,.txt';

	function hasActiveIngestion(docs: Document[]) {
		return docs.some(
			(doc) =>
				doc.status === JobStatus.Pending ||
				doc.status === JobStatus.Processing ||
				doc.status === JobStatus.Storing
		);
	}

	function schedulePoll() {
		if (pollTimer) return;
		pollTimer = setTimeout(async () => {
			pollTimer = null;
			await getDocuments();
			if (hasActiveIngestion(documents)) schedulePoll();
		}, 1000);
	}

	async function getDocuments() {
		const res = await fetch(`/api/projects/${projectId}/documents`);
		if (!res.ok) return;
		documents = await res.json();
	}

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';

		uploadError = '';
		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			const res = await fetch(`/api/projects/${projectId}/documents`, {
				method: 'POST',
				body: formData
			});
			if (!res.ok) {
				const body = await res.json();
				uploadError = body.message;
				return;
			}
			await getDocuments();
			if (hasActiveIngestion(documents)) schedulePoll();
		} finally {
			uploading = false;
		}
	}

	async function handleDelete(documentId: string) {
		documents = documents.filter((doc) => doc.id !== documentId);
		await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
	}

	$effect(() => {
		getDocuments().then(() => {
			if (hasActiveIngestion(documents)) schedulePoll();
		});
		return () => {
			if (pollTimer) clearTimeout(pollTimer);
			pollTimer = null;
		};
	});
</script>

<div class="document-list">
	<label class="upload-btn" class:disabled={uploading}>
		{uploading ? 'Uploading...' : 'Upload document'}
		<input type="file" accept={ACCEPTED_TYPES} onchange={handleUpload} disabled={uploading} />
	</label>
	{#if uploadError}
		<p class="upload-error">{uploadError}</p>
	{/if}
	<div class="documents">
		{#each documents as document (document.id)}
			<DocumentListItem {document} onDelete={handleDelete} />
		{/each}
	</div>
</div>

<style lang="scss">
	.document-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.upload-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10px 14px;
		border-radius: 8px;
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: opacity 0.2s;

		input {
			display: none;
		}

		&:hover {
			opacity: 0.85;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
	}

	.upload-error {
		font-size: 0.8rem;
		color: #e53e3e;
		margin: 0;
	}

	.documents {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
</style>
