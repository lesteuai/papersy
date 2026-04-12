<script lang="ts">
	import { getAuthClient } from '$lib/auth-client';
	import Button from '$lib/components/atoms/Button.svelte';
	import AuthCard from '$lib/components/dedicated/app/AuthCard.svelte';

	let email = $state('');
	let submitting = $state(false);
	let message = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		submitting = true;
		error = null;
		message = null;

		try {
			const { error: err } = await getAuthClient()!.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`,
			});

			if (err) {
				error = err.message ?? 'Failed to send reset email';
			} else {
				message = 'Check your email for password reset instructions.';
				email = '';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			submitting = false;
		}
	}
</script>

<AuthCard title="Forgot Password">
	<p class="subtitle">Enter your email address and we'll send you a password reset link.</p>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if message}
		<p class="success">{message}</p>
	{:else}
		<form class="auth-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					required
					disabled={submitting}
				/>
			</div>
			<div class="submit-row">
				<Button type="submit" disabled={submitting || !email}>{submitting ? 'Sending...' : 'Send Reset Link'}</Button>
			</div>
		</form>
	{/if}

	<div class="footer-section">
		<Button href="/" style="clear" size="small">Back to Login</Button>
	</div>
</AuthCard>

<style lang="scss">
	.subtitle {
		text-align: center;
		margin: 0 0 30px 0;
		color: rgba(var(--color--text-rgb), 0.7);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}
</style>
