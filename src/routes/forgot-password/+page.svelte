<script lang="ts">
	import { getAuthClient } from '$lib/auth-client';
	import Button from '$lib/components/atoms/Button.svelte';

	let email = $state('');
	let submitting = $state(false);
	let message = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		submitting = true;
		error = null;
		message = null;

		try {
			const { data, error: err } = await getAuthClient()!.requestPasswordReset({
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

<div class="forgot-password-wrapper">
	<div class="forgot-password-card">
		<h1>Forgot Password</h1>
		<p>Enter your email address and we'll send you a password reset link.</p>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if message}
			<p class="success">{message}</p>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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

		<div class="back-section">
			<Button href="/" style="clear" size="small">Back to Login</Button>
		</div>
	</div>
</div>

<style lang="scss">
	.forgot-password-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 85px);
		padding: 20px;
	}

	.forgot-password-card {
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
