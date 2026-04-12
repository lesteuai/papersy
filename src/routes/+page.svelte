<script lang="ts">
	import { loggedIn } from '$lib/stores/auth';
	import { getAuthClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';
	import FilePanel from '$lib/components/dedicated/app/FilePanel.svelte';
	import ContentPanel from '$lib/components/dedicated/app/ContentPanel.svelte';
	import type { PapersyFile, ChatMessage, Mode } from '$lib/components/dedicated/app/types';

	let { data } = $props();
	// File state — seed from server on load
	let files: PapersyFile[] = $state([]);

	// Sync loggedIn store from server session on mount
	onMount(() => {
		if (data.loggedIn) loggedIn.set(true);
		if (data.papers) files = data.papers;
	});

	let selectedFileId: string | null = $state(null);
	let selectedFile = $derived(files.find((f) => f.id === selectedFileId) ?? null);
	let uploading = $state(false);

	// Job tracking — map of placeeholder file ID -> { jobId, status, error? }
	let jobsInProgress: Record<string, { jobId: string; status: string; error?: string }> = $state({});

	// Content state
	let mode: Mode = $state('summary');
	let messages: ChatMessage[] = $state([]);

	// Mobile panel visibility — only relevant in portrait
	let mobileActivePanel: 'files' | 'content' = $state('files');

	async function handleLogin(email: string, password: string): Promise<string | null> {
		const { error } = await getAuthClient()!.signIn.email({ email, password });
		if (error) {
			const message = error.message?.replace(/^\[[^\]]+\]\s*/, '') ?? 'Login failed. Please try again';
			return message;
		} 
		loggedIn.set(true);
		return null;
	}

	async function handleSignUp(name: string, email: string, password: string): Promise<string | null> {
		const { error } = await getAuthClient()!.signUp.email({ name, email, password });
		if (error) {
			const message = error.message?.replace(/^\[[^\]]+\]\s*/, '') ?? 'Sign up failed. Please try again';
			return message;
		}
		// Email verification required — user will see verification page or message
		return null;
	}

	async function pollJobStatus(placeolderId: string, jobId: string) {
		const maxRetries = 120; // 2 minutes with 1s interval
		let retries = 0;

		const poll = async () => {
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) return;
				const jobData = await res.json();

				jobsInProgress[placeolderId] = { jobId, status: jobData.status, error: jobData.error };

				if (jobData.status === 'done' && jobData.paperId) {
					// Job complete — fetch the paper and replace placeholder
					const paperRes = await fetch(`/api/papers/${jobData.paperId}`);
					if (!paperRes.ok) {
						jobsInProgress[placeolderId].error = 'Failed to fetch completed paper';
						return;
					}
					const paperData = await paperRes.json();
					files = files.map((f) =>
						f.id === placeolderId
							? {
									id: paperData.id,
									name: paperData.name,
									summaryData: paperData.summaryData,
								}
							: f
					);
					// Update selectedFileId if this was the selected file
					if (selectedFileId === placeolderId) {
						selectedFileId = paperData.id;
						mode = 'summary';
					}
					delete jobsInProgress[placeolderId];
				} else if (jobData.status === 'failed') {
					// Job failed
					files = files.map((f) =>
						f.id === placeolderId ? { ...f, name: `${f.name} (Failed)` } : f
					);
					delete jobsInProgress[placeolderId];
				} else if (retries < maxRetries) {
					// Still processing — poll again
					retries++;
					setTimeout(poll, 1000);
				}
			} catch (err) {
				console.error('Poll error:', err);
				if (retries < maxRetries) {
					retries++;
					setTimeout(poll, 1000);
				}
			}
		};

		poll();
	}

	async function handleUpload(file: File) {
		uploading = true;
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch('/api/upload', { method: 'POST', body: formData });
		uploading = false;
		if (!res.ok) return;

		const data = await res.json();
		const { jobId } = data;

		// Create placeholder paper
		const placeolderId = crypto.randomUUID();
		files = [
			...files,
			{
				id: placeolderId,
				name: file.name,
				summaryData: undefined,
			},
		];
		selectedFileId = placeolderId;

		// Track job and start polling
		jobsInProgress[placeolderId] = { jobId, status: 'pending' };
		pollJobStatus(placeolderId, jobId);
	}

	function handleSelect(id: string) {
		selectedFileId = id;
		mobileActivePanel = 'content';
	}

	async function handleDelete(id: string) {
		const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
		if (!res.ok) return;
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
		mode = 'chat';
		messages = [...messages, { role: 'user', text }];
		// Add loading indicator
		messages = [...messages, { role: 'ai', text: '...' }];
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paperId: selectedFileId, messages: messages.slice(0, -1) }),
		});
		if (!res.ok) {
			messages[messages.length - 1] = { role: 'ai', text: 'Error: failed to get a response.' };
			return;
		}
		const data = await res.json();
		messages[messages.length - 1] = { role: 'ai', text: data.text };
	}
</script>

{#if !$loggedIn}
	<LoginCard onLogin={handleLogin} onSignUp={handleSignUp} />
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
