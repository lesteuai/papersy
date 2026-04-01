<script>
	import Socials from '$lib/components/molecules/Socials.svelte';
</script>

<footer>
	<div class="content">
		<div class="copyright">
			Le Steu AI
		</div>
		<div class="credits">
			Powered by <a href="https://kit.svelte.dev/" target="_blank" rel="noopener noreferrer"
				>SvelteKit</a>
		</div>
		<div class="socials">
			<Socials />
		</div>
	</div>
</footer>

<style lang="scss">
	footer {
		width: 100%;
		background: linear-gradient(60deg, var(--color--waves-start) 0%, var(--color--waves-end) 100%);
		display: flex;
		justify-content: center;

		.content {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 2rem;
			gap: 15px;
			font-weight: 600;
			text-align: center;

			.credits {
				font-weight: 400;
				font-size: 90%;
				color: var(--color--text-shade);
			}

			.socials {
				display: flex;
				align-items: center;
				gap: 20px;
			}
		}

		a {
			&:hover {
				filter: drop-shadow(0px 0px 3px var(--color--primary));
			}
		}
	}
</style>
