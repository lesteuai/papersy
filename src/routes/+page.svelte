<script lang="ts">
	import { loggedIn } from '$lib/stores/auth';
	import { getAuthClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';
	import FilePanel from '$lib/components/dedicated/app/FilePanel.svelte';
	import ContentPanel from '$lib/components/dedicated/app/ContentPanel.svelte';
	import type { PapersyFile, ChatMessage, Mode } from '$lib/utils/types';

	const pollTimeout = 5000;

	let { data } = $props();
	// File state — seed from server on load
	let files: PapersyFile[] = $state([]);

	// Sync loggedIn store from server session on mount
	onMount(() => {
		if (data.loggedIn) loggedIn.set(true);
		if (data.papers) {
			loadPaperstoFiles()
		}
	});

	let selectedFileId: string | null = $state(null);
	let selectedFile = $derived(files.find((f) => f.id === selectedFileId) ?? null);
	let uploading = $state(false);

	// Job tracking — map of placeholder file ID -> { jobId, status, error? }
	let jobsInProgress: Record<string, { jobId: string; status: string; error?: string }> = $state({});
	
	let isProcessing = $derived(
		selectedFileId && jobsInProgress[selectedFileId]
			? ['pending', 'processing'].includes(jobsInProgress[selectedFileId].status)
			: false
	);

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
		// Re-run the load() function so data.papers is populated with the user's papers
		await invalidateAll();
		if (data.papers) {
			loadPaperstoFiles()
		}
		loggedIn.set(true);
		return null;
	}

	function loadPaperstoFiles() {
		files = data.papers;
		// Resume polling for any in-progress jobs from server
		for (const p of data.papers) {
			if (p.jobId && (p.jobStatus === 'pending' || p.jobStatus === 'processing')) {
				jobsInProgress[p.id] = { jobId: p.jobId, status: p.jobStatus };
				pollJobStatus(p.id, p.jobId);
			}
		}
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

	async function pollJobStatus(paperId: string, jobId: string) {
		const maxRetries = 120; // 2 minutes with 1s interval
		let retries = 0;

		const poll = async () => {
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) return;
				const jobData = await res.json();

				jobsInProgress[paperId] = { jobId, status: jobData.status, error: jobData.error };

				if (jobData.status === 'done') {
					// Job complete — fetch the paper to get updated summary data
					const paperRes = await fetch(`/api/papers/${paperId}`);
					if (!paperRes.ok) {
						jobsInProgress[paperId].error = 'Failed to fetch completed paper';
						return;
					}
					const paperData = await paperRes.json();
					files = files.map((f) =>
						f.id === paperId
							? {
									id: f.id,
									name: paperData.name,
									summaryData: paperData.summaryData,
									jobId: undefined,
									jobStatus: undefined,
								}
							: f
					);
					if (selectedFileId === paperId) {
						mode = 'summary';
					}
					delete jobsInProgress[paperId];
				} else if (jobData.status === 'failed') {
					// Job failed
					files = files.map((f) =>
						f.id === paperId
							? { ...f, name: `${f.name} (Failed)`, jobId: undefined, jobStatus: undefined }
							: f
					);
					delete jobsInProgress[paperId];
				} else if (retries < maxRetries) {
					// Still processing — poll again
					retries++;
					setTimeout(poll, pollTimeout);
				}
			} catch (err) {
				console.error('Poll error:', err);
				if (retries < maxRetries) {
					retries++;
					setTimeout(poll, pollTimeout);
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

		const uploadData = await res.json();
		const { jobId, paperId } = uploadData;

		// Add paper to files list with job tracking info
		files = [
			...files,
			{
				id: paperId,
				name: file.name,
				summaryData: undefined,
				jobId,
				jobStatus: 'pending',
			},
		];

		// Track job and start polling
		jobsInProgress[paperId] = { jobId, status: 'pending' };
		pollJobStatus(paperId, jobId);
	}

	function handleSelect(id: string) {
		if (id !== selectedFileId) {
			mode = 'summary';
			messages = [];
		}
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
		// Stop polling if this file had an active job
		delete jobsInProgress[id];
	}

	function handleBack() {
		mode = 'summary';
		messages = [];
		if (window.innerWidth < window.innerHeight) {
			mobileActivePanel = 'files';
		} else {
			selectedFileId = null;
		}
	}

	async function handleSend(text: string) {
		mode = 'chat';
		messages = [...messages, { role: 'user', text }];
		// Add loading indicator with animated dots
		messages = [...messages, { role: 'ai', text: '', loading: true }];
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paperId: selectedFileId, messages: messages.slice(0, -1) }),
		});
		if (!res.ok) {
			messages = [...messages.slice(0, -1), { role: 'ai', text: 'Error: failed to get a response.' }];
			return;
		}
		const data = await res.json();
		messages = [...messages.slice(0, -1), { role: 'ai', text: data.text }];
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
					disabled={isProcessing}
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
