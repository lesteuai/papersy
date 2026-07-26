<script lang="ts">
	import { goto } from '$app/navigation';
	import { loggedIn } from '$lib/stores/auth';
	import { getAuthClient } from '$lib/auth-client';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';
	import ProjectList from '$lib/components/dedicated/app/ProjectList.svelte';
	import type { Project } from '$lib/utils/types';

	let projects = $state<Project[]>([]);
	let apiError = $state<string | null>(null);

	async function getProjects() {
		const res = await fetch('/api/projects');
		if (res.ok) projects = await res.json();
	}

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
		// Email verification is off, so a signed-up user can log in immediately
		return null;
	}

	async function handleCreate(name: string) {
		apiError = null;
		const res = await fetch('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (!res.ok) {
			const { message } = await res.json();
			apiError = message;
			return;
		}
		const project = await res.json();
		projects = [...projects, project];
	}

	function handleSelect(id: string) {
		goto(`/p/${id}`);
	}

	async function handleRename(id: string, name: string) {
		apiError = null;
		const res = await fetch(`/api/projects/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (!res.ok) {
			const { message } = await res.json();
			apiError = message;
			return;
		}
		const updated = await res.json();
		projects = projects.map((project) => (project.id === id ? updated : project));
	}

	async function handleDelete(id: string) {
		const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
		if (res.ok) projects = projects.filter((project) => project.id !== id);
	}

	$effect(() => {
		if ($loggedIn) getProjects();
	});
</script>

{#if !$loggedIn}
	<LoginCard onLogin={handleLogin} onSignUp={handleSignUp} />
{:else}
	{#if apiError}
		<p class="error">{apiError}</p>
	{/if}
	<ProjectList
		{projects}
		onCreate={handleCreate}
		onSelect={handleSelect}
		onRename={handleRename}
		onDelete={handleDelete}
	/>
{/if}

<style lang="scss">
	.error {
		margin: 8px 16px 0;
		font-size: 0.8rem;
		color: #e53e3e;
	}
</style>
