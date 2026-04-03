<script lang="ts">
	import { loggedIn } from '$lib/stores/auth';
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';
	import FilePanel from '$lib/components/dedicated/app/FilePanel.svelte';
	import ContentPanel from '$lib/components/dedicated/app/ContentPanel.svelte';
	import type { PapersyFile, ChatMessage, Mode } from '$lib/components/dedicated/app/types';

	let { data } = $props();

	// Sync loggedIn store from server session on mount
	onMount(() => {
		if (data.loggedIn) loggedIn.set(true);
	});

	// File state — seed from server on load
	let files: PapersyFile[] = $state(data.papers ?? []);
	let selectedFileId: string | null = $state(null);
	let selectedFile = $derived(files.find((f) => f.id === selectedFileId) ?? null);
	let uploading = $state(false);

	// Content state
	let mode: Mode = $state('summary');
	let messages: ChatMessage[] = $state([]);

	// Mobile panel visibility — only relevant in portrait
	let mobileActivePanel: 'files' | 'content' = $state('files');

	async function handleLogin(email: string, password: string): Promise<string | null> {
		const { error } = await authClient.signIn.email({ email, password });
		if (error) return error.message ?? 'Login failed';
		loggedIn.set(true);
		return null;
	}

	async function handleUpload(file: File) {
		uploading = true;
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch('/api/upload', { method: 'POST', body: formData });
		uploading = false;
		if (!res.ok) return;
		const data = await res.json();
		files = [
			...files,
			{
				id: data.id,
				name: data.name,
				summaryData: {
					summary: data.summary,
					keyFindings: data.keyFindings,
					methodology: data.methodology,
					limitations: data.limitations,
					references: data.references,
				},
			},
		];
		selectedFileId = data.id;
	}

	function handleSelect(id: string) {
		selectedFileId = id;
		mobileActivePanel = 'content';
	}

	async function handleDelete(id: string) {
		await fetch(`/api/papers/${id}`, { method: 'DELETE' });
		files = files.filter((f) => f.id !== id);
		if (selectedFileId === id) {
			selectedFileId = null;
			mobileActivePanel = 'files';
		}
	}

	function handleBack() {
		if (window.innerWidth < window.innerHeight) {
			mobileActivePanel = 'files';
		} else {
			selectedFileId = null;
		}
	}

	async function handleSend(text: string) {
		messages = [...messages, { role: 'user', text }];
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paperId: selectedFileId, messages }),
		});
		if (!res.ok) {
			messages = [...messages, { role: 'ai', text: 'Error: failed to get a response.' }];
			return;
		}
		const data = await res.json();
		messages = [...messages, { role: 'ai', text: data.text }];
	}
</script>

{#if !$loggedIn}
	<LoginCard onLogin={handleLogin} />
{:else}
	<div class="app-shell">
		<div class="file-panel-wrap" class:hidden={mobileActivePanel === 'content'}>
			<FilePanel
				{files}
				{selectedFileId}
				{uploading}
				onUpload={handleUpload}
				onSelect={handleSelect}
				onDelete={handleDelete}
			/>
		</div>
		{#if selectedFile}
			<div class="content-panel-wrap" class:hidden={mobileActivePanel === 'files'}>
				<ContentPanel
					{mode}
					{messages}
					summaryData={selectedFile?.summaryData ?? null}
					onBack={handleBack}
					onModeChange={(m) => (mode = m)}
					onSend={handleSend}
				/>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.app-shell {
		display: flex;
		height: calc(100vh - 85px);
	}

	.file-panel-wrap {
		flex: 0 0 28%;
		min-width: 220px;
		max-width: 300px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.content-panel-wrap {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	// Portrait mobile — one panel at a time
	@media (orientation: portrait) and (max-width: 767px) {
		.file-panel-wrap,
		.content-panel-wrap {
			flex: 0 0 100%;
			max-width: 100%;
			width: 100%;
		}

		.hidden {
			display: none;
		}
	}
</style>
