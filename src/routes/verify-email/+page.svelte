<script lang="ts">
	import { onMount } from 'svelte';
	import { getAuthClient } from '$lib/auth-client';
	import Button from '$lib/components/atoms/Button.svelte';

	let { data } = $props();

	let verifying = $state(true);
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(async () => {
		try {
			const { data: result, error: err } = await getAuthClient()!.verifyEmail({ query: { token: data.token } });
			if (err) {
				error = err.message ?? 'Verification failed';
			} else {
				success = true;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			verifying = false;
		}
	});
</script>

<div class="verify-container">
	{#if verifying}
		<p>Verifying email...</p>
	{:else if success}
		<h1>Email Verified!</h1>
		<p>Your email has been successfully verified.</p>
		<Button href="/">Return Home</Button>
	{:else}
		<h1>Verification Failed</h1>
		<p>{error}</p>
		<Button href="/auth/sign-up">Sign Up Again</Button>
	{/if}
</div>

<style lang="scss">
	.verify-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
		gap: 20px;
	}
</style>
