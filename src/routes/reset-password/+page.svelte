<script lang="ts">
	import { getAuthClient } from '$lib/auth-client';
	import Button from '$lib/components/atoms/Button.svelte';

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

<div class="reset-password-container">
	<div class="form-card">
		<h1>Reset Password</h1>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if success}
			<div class="success">
				<p>Your password has been reset successfully!</p>
				<Button href="/">Sign In</Button>
			</div>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<input
					type="password"
					placeholder="New Password"
					bind:value={password}
					required
					disabled={submitting}
				/>
				<input
					type="password"
					placeholder="Confirm Password"
					bind:value={confirmPassword}
					required
					disabled={submitting}
				/>
				<Button type="submit" disabled={submitting || !password || !confirmPassword}>
					{submitting ? 'Resetting...' : 'Reset Password'}
				</Button>
			</form>
		{/if}
	</div>
</div>

<style lang="scss">
	.reset-password-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
	}

	.form-card {
		width: 100%;
		max-width: 400px;
		padding: 30px;
		border-radius: 8px;
		background: rgba(var(--color--text-rgb), 0.02);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);

		h1 {
			margin: 0 0 20px 0;
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 12px;
			margin-bottom: 16px;
		}

		input {
			padding: 8px 12px;
			border: 1px solid rgba(var(--color--text-rgb), 0.2);
			border-radius: 4px;
			font-size: 14px;

			&:disabled {
				opacity: 0.6;
			}
		}
	}

	.error {
		padding: 12px;
		margin-bottom: 16px;
		background: rgba(255, 0, 0, 0.1);
		border: 1px solid rgba(255, 0, 0, 0.3);
		border-radius: 4px;
		color: rgba(255, 0, 0, 0.8);
		font-size: 14px;
	}

	.success {
		padding: 12px;
		margin-bottom: 16px;
		background: rgba(0, 255, 0, 0.1);
		border: 1px solid rgba(0, 255, 0, 0.3);
		border-radius: 4px;
		color: rgba(0, 255, 0, 0.8);
		font-size: 14px;

		p {
			margin: 0 0 12px 0;
		}
	}
</style>
