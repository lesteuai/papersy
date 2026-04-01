<script>
	import PricingCard from './PricingCard.svelte';
</script>

<section class="pricing container">
	<h2>Pricing.</h2>
	<PricingCard
		planName="Beta"
		price="Free"
		description="Everything Papersy can do, at no cost, for the duration of the beta."
		features={[
			'Unlimited paper summaries',
			'Natural language Q&A on any paper',
			'Related paper discovery',
			'PDF uploads + URL imports',
			'Priority access to new features as they ship'
		]}
		ctaLabel="Get early access"
		ctaHref="/contact"
	/>
</section>

<style lang="scss">
	.pricing {
		padding-top: 70px;
		padding-bottom: 70px;

		h2 {
			margin-bottom: 36px;
		}
	}
</style>
