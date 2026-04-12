<script lang="ts">
	import Logo from '$lib/components/atoms/Logo.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { loggedIn } from '$lib/stores/auth';
	import { getAuthClient } from '$lib/auth-client';

	async function handleLogout() {
		await getAuthClient()!.signOut();
		loggedIn.set(false);
	}
</script>

<header>
	<nav class="container">
		<a class="logo" href="/" aria-label="Site logo">
			<Logo />
		</a>

		{#if $loggedIn}
			<Button style="clear" onclick={handleLogout}>Logout</Button>
		{/if}
	</nav>
</header>

<style lang="scss">
	header {
		position: static;
		padding: 8px 0;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);

		.container {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.logo {
			height: 48px;
		}
	}
</style>
