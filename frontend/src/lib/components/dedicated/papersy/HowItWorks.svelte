<script>
	import Step from './HowItWorksStep.svelte';
</script>

<section class="how-it-works container">
	<h2>How it works.</h2>
	<p class="section-sub">From paper to insight in under a minute.</p>
	<div class="steps">
		<Step number={1} title="Paste a URL or upload a PDF" description="Works with any direct PDF link." connector />
		<Step number={2} title="Papersy reads and indexes the full text" description="The whole paper, including figures, tables, and supplementary material." connector />
		<Step number={3} title="Get your summary" description="Structured breakdown: objective, method, results, limitations." connector />
		<Step number={4} title="Ask follow-up questions" description="Dig deeper on anything: methodology, terminology, that part you are trying to get for your research." />
		<!-- <Step number={5} title="Explore related papers" description="Build your reading list from the connections Papersy surfaces, not from blind searches." connector /> -->
	</div>
</section>

<style lang="scss">
	.how-it-works {
		padding-top: 70px;
		padding-bottom: 70px;

		h2 {
			margin-bottom: 8px;
		}

		.section-sub {
			color: var(--color--text-shade);
			font-size: 1.1rem;
			margin-bottom: 40px;
		}
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 0;
		max-width: 640px;
	}
</style>
