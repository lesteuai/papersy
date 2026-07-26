<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import ArrowLeftIcon from '$lib/icons/arrow-left.svelte';
	import SessionList from '$lib/components/dedicated/app/SessionList.svelte';
	import DocumentList from '$lib/components/dedicated/app/DocumentList.svelte';
	import type { Project, Session } from '$lib/utils/types';

	let { children } = $props();

	const projectId = $derived(page.params.projectId!);
	const selectedSessionId = $derived(page.params.sessionId ?? null);

	let project = $state<Project | null>(null);
	let sessions = $state<Session[]>([]);
	let activeTab: 'chats' | 'docs' = $state('chats');

	// Mobile panel visibility — only relevant in portrait
	let mobileActivePanel: 'sessions' | 'content' = $state('sessions');

	async function getProject() {
		const res = await fetch('/api/projects');
		if (!res.ok) {
			await goto('/');
			return;
		}
		const projects: Project[] = await res.json();
		const found = projects.find((p) => p.id === projectId);
		if (!found) {
			await goto('/');
			return;
		}
		project = found;
	}

	async function getSessions() {
		const res = await fetch(`/api/projects/${projectId}/sessions`);
		if (res.status === 404) {
			await goto('/');
			return;
		}
		if (!res.ok) return;
		sessions = await res.json();
	}

	async function handleCreateSession() {
		const res = await fetch(`/api/projects/${projectId}/sessions`, { method: 'POST' });
		if (!res.ok) return;
		const session: Session = await res.json();
		sessions = [...sessions, session];
		mobileActivePanel = 'content';
		await goto(`/p/${projectId}/c/${session.id}`);
	}

	async function handleSelectSession(id: string) {
		mobileActivePanel = 'content';
		await goto(`/p/${projectId}/c/${id}`);
	}

	async function handleRenameSession(id: string, name: string) {
		const res = await fetch(`/api/sessions/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (!res.ok) return;
		const updated: Session = await res.json();
		sessions = sessions.map((session) => (session.id === id ? updated : session));
	}

	async function handleDeleteSession(id: string) {
		const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
		if (!res.ok) return;
		sessions = sessions.filter((session) => session.id !== id);
		if (selectedSessionId === id) await goto(`/p/${projectId}`);
	}

	function handleBack() {
		mobileActivePanel = 'sessions';
		goto(`/p/${projectId}`);
	}

	// Exposed via context so nested chat pages (T17) can refresh the list
	// once an unnamed session gains its label from the first user message,
	// and so the empty state (+page.svelte) can create a session that shows
	// up in the list immediately instead of only after a reload.
	setContext('refreshSessions', getSessions);
	setContext('createSession', handleCreateSession);

	$effect(() => {
		getProject();
		getSessions();
	});
</script>

<div class="app-shell">
	<div class="side-panel-wrap" class:hidden={mobileActivePanel === 'content'}>
		<div class="project-header">
			<h1>{project?.name ?? ''}</h1>
		</div>
		<div class="tabs">
			<button class="tab" class:active={activeTab === 'chats'} onclick={() => (activeTab = 'chats')}>
				Chats
			</button>
			<button class="tab" class:active={activeTab === 'docs'} onclick={() => (activeTab = 'docs')}>
				Docs
			</button>
		</div>
		<div class="tab-body">
			{#if activeTab === 'chats'}
				<SessionList
					{sessions}
					selectedId={selectedSessionId}
					onCreate={handleCreateSession}
					onSelect={handleSelectSession}
					onRename={handleRenameSession}
					onDelete={handleDeleteSession}
				/>
			{:else}
				<div class="docs-panel">
					<DocumentList {projectId} />
				</div>
			{/if}
		</div>
	</div>
	<div class="content-panel-wrap" class:hidden={mobileActivePanel === 'sessions'}>
		<div class="content-header">
			<button class="back-btn" onclick={handleBack} aria-label="Back to chats and docs">
				<ArrowLeftIcon />
			</button>
		</div>
		<div class="content-body">
			{@render children()}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.app-shell {
		display: flex;
		height: calc(100vh - 85px);
	}

	.side-panel-wrap {
		flex: 0 0 28%;
		min-width: 220px;
		max-width: 300px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.content-panel-wrap {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	// Portrait mobile — one panel at a time
	@media (orientation: portrait) and (max-width: 767px) {
		.side-panel-wrap,
		.content-panel-wrap {
			flex: 0 0 100%;
			max-width: 100%;
			width: 100%;
		}

		.hidden {
			display: none;
		}
	}

	.project-header {
		padding: 16px 16px 0;

		h1 {
			margin: 0;
			font-size: 1.1rem;
			color: var(--color--text);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 12px 16px 0;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.tab {
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		color: var(--color--text-shade);
		padding: 8px 14px;
		border-radius: 6px 6px 0 0;
		transition: all 0.15s;

		&:hover {
			color: var(--color--text);
			background-color: rgba(var(--color--text-rgb), 0.06);
		}

		&.active {
			color: var(--color--primary);
			font-weight: 600;
			border-bottom: 2px solid var(--color--primary);
		}
	}

	.tab-body {
		flex: 1;
		overflow-y: auto;
	}

	.docs-panel {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 1rem;
			color: var(--color--text);
		}
	}

	.content-header {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
		flex-shrink: 0;
	}

	.back-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color--text);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		padding: 4px;
		flex-shrink: 0;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.08);
		}
	}

	.content-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
</style>
