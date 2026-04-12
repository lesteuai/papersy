<script>
	import Button from '$lib/components/atoms/Button.svelte';

	let { title, tagline, ctaLabel, ctaHref, subline = undefined } = $props();
</script>

<section id="hero">
	<h1>{title}</h1>
	<p class="tagline">{tagline}</p>
	{#if subline}
		<p class="subline">{subline}</p>
	{/if}
	<div class="cta">
		<Button color="primary" size="large" href={ctaHref}>
			{ctaLabel}
		</Button>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	#hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 80px 0 70px;
		text-align: center;

		@include for-phone-only {
			padding: 50px 0 50px;
		}

		h1 {
			font-size: 3.5rem;
			margin: 0;

			@include for-phone-only {
				font-size: 2.5rem;
			}
		}

		.tagline {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color--primary);
			margin: 0;
		}

		.subline {
			font-size: 1.1rem;
			color: var(--color--text-shade);
			max-width: 560px;
			line-height: 1.65;
			margin: 4px 0 8px;
		}

		.cta {
			display: flex;
		}
	}
</style>
