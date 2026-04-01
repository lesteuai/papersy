<script lang="ts">
	import Hero from '$lib/components/organisms/Hero.svelte';
	import ProblemSolution from '$lib/components/organisms/ProblemSolution.svelte';
	import ProductShowcase from '$lib/components/organisms/ProductShowcase.svelte';
	import FeaturePillars from '$lib/components/organisms/FeaturePillars.svelte';
	import SocialProof from '$lib/components/organisms/SocialProof.svelte';
	import CtaBanner from '$lib/components/organisms/CtaBanner.svelte';
</script>

<div class="container">
	<Hero
		title="Papersy"
		tagline="Your AI research assistant."
		subline="Papersy reads the papers so you can focus on the research. Paste any paper, get a summary, ask questions."
		ctaLabel="Join the waitlist"
		ctaHref="https://forms.gle/xHmD8By9xAqoBB9d9"
	/>
	<ProblemSolution />
	<ProductShowcase />
	<!-- <FeaturePillars /> -->
	<!-- <SocialProof /> -->
	<CtaBanner />
</div>
