<script lang="ts">
	import { loggedIn } from '$lib/stores/auth';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';
	import FilePanel from '$lib/components/dedicated/app/FilePanel.svelte';
	import ContentPanel from '$lib/components/dedicated/app/ContentPanel.svelte';
	import type { PapersyFile, ChatMessage, Mode } from '$lib/components/dedicated/app/types';

	// File state
	let files: PapersyFile[] = $state([]);
	let selectedFileId: string | null = $state(null);
	let selectedFile = $derived(files.find((f) => f.id === selectedFileId) ?? null);

	// Content state
	let mode: Mode = $state('summary');
	let messages: ChatMessage[] = $state([]);

	// Mobile panel visibility — only relevant in portrait
	let mobileActivePanel: 'files' | 'content' = $state('files');

	function handleUpload(file: File) {
		const id = crypto.randomUUID();
		files = [...files, { id, name: file.name }];
	}

	function handleSelect(id: string) {
		selectedFileId = id;
		mobileActivePanel = 'content';
	}

	function handleDelete(id: string) {
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

	function handleSend(text: string) {
		messages = [...messages, { role: 'user', text }];
		// AI response placeholder — replace with real API call
		setTimeout(() => {
			messages = [...messages, { role: 'ai', text: 'This feature will connect to the backend soon.' }];
		}, 500);
	}
</script>

{#if !$loggedIn}
	<LoginCard onLogin={() => loggedIn.set(true)} />
{:else}
	<div class="app-shell">
		<div class="file-panel-wrap" class:hidden={mobileActivePanel === 'content'}>
			<FilePanel
				{files}
				{selectedFileId}
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
					summaryData={null}
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
