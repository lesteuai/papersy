<script>
	let { title, description } = $props();
</script>

<div class="tech-item">
	<h4>{title}</h4>
	<p>{description}</p>
</div>

<style lang="scss">
	.tech-item {
		h4 {
			margin-bottom: 8px;
		}

		p {
			font-size: 0.95rem;
			color: var(--color--text-shade);
			line-height: 1.65;
			margin: 0;
		}
	}
</style>
