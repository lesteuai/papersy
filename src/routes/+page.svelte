<script lang="ts">
	import { loggedIn } from '$lib/stores/auth';
	import { getAuthClient } from '$lib/auth-client';
	import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte';

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
</script>

{#if !$loggedIn}
	<LoginCard onLogin={handleLogin} onSignUp={handleSignUp} />
{:else}
	<h1>Projects</h1>
{/if}

<!--
	The app-shell / file-panel-wrap / content-panel-wrap layout below is about to move
	to src/routes/p/[projectId]/+layout.svelte. Kept here unused for that migration.
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
-->
