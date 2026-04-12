<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';

	let { onLogin, onSignUp }: {
		onLogin: (email: string, password: string) => Promise<string | null>;
		onSignUp: (name: string, email: string, password: string) => Promise<string | null>;
	} = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (mode === 'signin') {
			if (!email || !password) return;
			loading = true;
			error = null;
			error = await onLogin(email, password);
			loading = false;
		} else {
			if (!name || !email || !password) return;
			loading = true;
			error = null;
			error = await onSignUp(name, email, password);
			loading = false;
		}
	}
</script>

<div class="login-wrapper">
	<div class="login-card">
		<h1>Papersy</h1>
		<form onsubmit={handleSubmit}>
			{#if mode === 'signup'}
				<div class="field">
					<label for="name">Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						placeholder="Enter your name"
						autocomplete="name"
					/>
				</div>
			{/if}
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					autocomplete="email"
				/>
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
				/>
			</div>
			{#if error}
				<p class="error">{error}</p>
			{/if}
			<div class="submit-row">
				<Button type="submit" disabled={loading}>
					{loading ? (mode === 'signin' ? 'Logging in...' : 'Signing up...') : (mode === 'signin' ? 'Login' : 'Sign Up')}
				</Button>
			</div>
		</form>

		<div class="toggle-section">
			{#if mode === 'signin'}
				<p>Don't have an account? <button type="button" onclick={() => { mode = 'signup'; error = null; name = ''; email = ''; password = ''; }}>Sign Up</button></p>
				<p><Button href="/forgot-password" style="clear" size="small">Forgot password?</Button></p>
			{:else}
				<p>Already have an account? <button type="button" onclick={() => { mode = 'signin'; error = null; email = ''; password = ''; }}>Sign In</button></p>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.login-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 85px);
		padding: 20px;
	}

	.login-card {
		background: var(--color--card-background);
		box-shadow: var(--card-shadow);
		border-radius: 12px;
		padding: 40px;
		width: 100%;
		max-width: 400px;

		h1 {
			font-size: 2rem;
			text-align: center;
			margin-bottom: 30px;
			color: var(--color--primary);
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 20px;
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
		}
	}

	.error {
		font-size: 0.875rem;
		color: #e53e3e;
		margin: 0;
	}

	.submit-row {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	.toggle-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid rgba(var(--color--text-rgb), 0.1);
		display: flex;
		flex-direction: column;
		gap: 8px;

		p {
			margin: 0;
			font-size: 0.875rem;
			color: rgba(var(--color--text-rgb), 0.7);
		}

		button {
			background: none;
			border: none;
			color: var(--color--primary);
			cursor: pointer;
			font-weight: 600;
			padding: 0;
			text-decoration: underline;

			&:hover {
				text-decoration: none;
			}
		}
	}
</style>
