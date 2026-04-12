<script>
	let { emoji, title, description } = $props();
</script>

<div class="persona">
	<span class="persona-icon" aria-hidden="true">{emoji}</span>
	<h4>{title}</h4>
	<p>{description}</p>
</div>

<style lang="scss">
	.persona {
		background-color: var(--color--card-background);
		border-radius: 12px;
		padding: 24px 20px;
		box-shadow: var(--card-shadow);
		display: flex;
		flex-direction: column;
		gap: 10px;

		h4 {
			margin: 0;
		}

		p {
			font-size: 0.9rem;
			color: var(--color--text-shade);
			line-height: 1.55;
			margin: 0;
		}
	}

	.persona-icon {
		font-size: 1.8rem;
		line-height: 1;
	}
</style>
