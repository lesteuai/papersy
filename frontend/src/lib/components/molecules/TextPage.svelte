<script>
	let { title, children } = $props();
</script>

<section class="text-page container">
	<h1>{title}</h1>
	{@render children()}
</section>

<style lang="scss">
	.text-page {
		padding-top: 80px;
		padding-bottom: 80px;
		max-width: 720px;

		h1 {
			font-size: 2.5rem;
			margin-bottom: 2rem;
		}

		:global(p) {
			font-size: 1.15rem;
			line-height: 1.8;
			margin-bottom: 1.5rem;
		}
	}
</style>
