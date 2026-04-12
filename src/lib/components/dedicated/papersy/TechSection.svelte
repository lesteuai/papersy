<script>
	import TechSectionItem from './TechSectionItem.svelte';
</script>

<section class="tech container">
	<h2>Under the hood.</h2>
	<div class="tech-grid">
		<TechSectionItem
			title="State-of-the-art language models"
			description="Papersy is powered by the latest AI model, tuned specifically for scientific language."
		/>
		<TechSectionItem
			title="Grounded answers only"
			description="Every answer links back to the source. If the evidence isn't in the paper, Papersy tells you rather than making something up."
		/>
		<TechSectionItem
			title="Your data stays yours"
			description="Papers you upload are never used to train models. We process, summarize, and the papers only stay in our database for the AI model to reference when there is a question asked."
		/>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.tech {
		padding-top: 70px;
		padding-bottom: 70px;

		h2 {
			margin-bottom: 36px;
		}
	}

	.tech-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}
</style>
