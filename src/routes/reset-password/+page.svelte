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

<div class="reset-password-wrapper">
	<div class="reset-password-card">
		<h1>Reset Password</h1>
		<p>Enter a new password to complete your password reset.</p>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if success}
			<div class="success">
				<p>Your password has been reset successfully!</p>
				<Button href="/">Sign In</Button>
			</div>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="field">
					<label for="password">New Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter new password"
						required
						disabled={submitting}
					/>
				</div>
				<div class="field">
					<label for="confirmPassword">Confirm Password</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						placeholder="Confirm password"
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

		<div class="back-section">
			<Button href="/" style="clear" size="small">Back to Login</Button>
		</div>
	</div>
</div>

<style lang="scss">
	.reset-password-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 85px);
		padding: 20px;
	}

	.reset-password-card {
		background: var(--color--card-background);
		box-shadow: var(--card-shadow);
		border-radius: 12px;
		padding: 40px;
		width: 100%;
		max-width: 400px;

		h1 {
			font-size: 2rem;
			text-align: center;
			margin-bottom: 20px;
			color: var(--color--primary);
		}

		> p {
			text-align: center;
			margin: 0 0 30px 0;
			color: rgba(var(--color--text-rgb), 0.7);
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 20px;
			margin-bottom: 20px;
		}
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;

		label {
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--color--text-shade);
		}

		input {
			padding: 10px 14px;
			border: 1px solid rgba(var(--color--text-rgb), 0.2);
			border-radius: 8px;
			font: inherit;
			font-size: 1rem;
			background: var(--color--page-background);
			color: var(--color--text);
			transition: border-color 0.2s;

			&:focus {
				outline: none;
				border-color: var(--color--primary);
			}

			&:disabled {
				opacity: 0.6;
			}
		}
	}

	.error {
		font-size: 0.875rem;
		color: #e53e3e;
		margin: 0 0 20px 0;
		padding: 12px 14px;
		background: rgba(229, 62, 62, 0.1);
		border: 1px solid rgba(229, 62, 62, 0.2);
		border-radius: 8px;
	}

	.success {
		font-size: 0.875rem;
		color: #22863a;
		margin: 0 0 20px 0;
		padding: 12px 14px;
		background: rgba(34, 134, 58, 0.1);
		border: 1px solid rgba(34, 134, 58, 0.2);
		border-radius: 8px;

		p {
			margin: 0 0 12px 0;
		}
	}

	.submit-row {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	.back-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
	}
</style>
