<script>
	import PersonaCard from './ForWhoPersonaCard.svelte';
</script>

<section class="for-who">
	<div class="container">
		<h2>Built for people who read seriously.</h2>
		<div class="persona-grid">
			<PersonaCard emoji="🎓" title="Students" description="Stay on top of a fast-moving field without burning a week on literature reviews." />
			<PersonaCard emoji="🔬" title="Researchers" description="Vet papers faster and make sure you're not missing critical related work." />
			<PersonaCard emoji="🏫" title="Professors" description="Quickly assess whether a paper is worth assigning or worth citing in your own work." />
			<PersonaCard emoji="📰" title="Science journalists" description="Make sense of dense technical studies with some domain expertise." />
		</div>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.for-who {
		padding: 70px 0;
		background-color: rgba(var(--color--primary-rgb), 0.03);
		border-top: 1px solid rgba(var(--color--primary-rgb), 0.08);
		border-bottom: 1px solid rgba(var(--color--primary-rgb), 0.08);

		h2 {
			margin-bottom: 36px;
		}
	}

	.persona-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;

		@include for-tablet-portrait-down {
			grid-template-columns: 1fr 1fr;
		}

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}
</style>
