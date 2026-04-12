<script lang="ts">
	import { getAuthClient } from '$lib/auth-client';
	import Button from '$lib/components/atoms/Button.svelte';
	import AuthCard from '$lib/components/dedicated/app/AuthCard.svelte';

	let { data } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit() {
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		submitting = true;
		error = null;

		try {
			const { data: result, error: err } = await getAuthClient()!.resetPassword({
				newPassword: password,
				token: data.token,
			});

			if (err) {
				error = err.message ?? 'Failed to reset password';
			} else {
				success = true;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			submitting = false;
		}
	}
</script>

<AuthCard title="Reset Password">
	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if success}
		<div class="success success--reset">
			<p>Your password has been reset successfully!</p>
			<Button href="/">Sign In</Button>
		</div>
	{:else}
		<form class="auth-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="field">
				<label for="password">New Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					disabled={submitting}
				/>
			</div>
			<div class="field">
				<label for="confirm-password">Confirm Password</label>
				<input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					required
					disabled={submitting}
				/>
			</div>
			<div class="submit-row">
				<Button type="submit" disabled={submitting || !password || !confirmPassword}>
					{submitting ? 'Resetting...' : 'Reset Password'}
				</Button>
			</div>
		</form>
	{/if}

	<div class="footer-section">
		<Button href="/" style="clear" size="small">Back to Login</Button>
	</div>
</AuthCard>

<style lang="scss">
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}

	.success--reset {
		p {
			margin: 0 0 12px 0;
		}
	}
</style>
