<script>
	import Button from '$lib/components/atoms/Button.svelte';
</script>

<section id="cta-banner">
	<h2>Work smarter, not harder.</h2>
	<!-- <p>Free during beta. No credit card required.</p> -->
	<Button color="primary" size="large" href="https://forms.gle/xHmD8By9xAqoBB9d9">
		Join the waitlist
	</Button>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	#cta-banner {
		margin: 60px 0;
		padding: 60px 40px;
		border-radius: 20px;
		background: linear-gradient(
			135deg,
			rgba(var(--color--primary-rgb), 0.12) 0%,
			rgba(var(--color--primary-rgb), 0.04) 100%
		);
		border: 1px solid rgba(var(--color--primary-rgb), 0.18);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;

		@include for-phone-only {
			padding: 40px 24px;
			margin: 40px 0;
		}

		h2 {
			margin: 0;
		}
	}
</style>
