<script lang="ts">
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
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const err = await res.json();
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

<div class="forgot-password-container">
	<div class="form-card">
		<h1>Forgot Password</h1>
		<p>Enter your email address and we'll send you a password reset link.</p>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if message}
			<div class="success">{message}</div>
		{:else}
			<form onsubmit|preventDefault={handleSubmit}>
				<input type="email" placeholder="Email" bind:value={email} required disabled={submitting} />
				<Button type="submit" disabled={submitting || !email}>{submitting ? 'Sending...' : 'Send Reset Link'}</Button>
			</form>
		{/if}

		<p><Button href="/" style="clear">Back Home</Button></p>
	</div>
</div>

<style lang="scss">
	.forgot-password-container {
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
			margin: 0 0 8px 0;
		}

		p {
			margin: 0 0 20px 0;
			color: rgba(var(--color--text-rgb), 0.7);
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
	}
</style>
