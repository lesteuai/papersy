<script>
	// export let animated = true;
</script>

<div class="logo">
	<img src="images/le-steu-logo.png" alt="Le Steu AI Logo">
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.logo {
		width: auto;
		height: 100%;

		img {
			height: 100%;
			width: auto;
			object-fit: contain;
		}

		display: flex;
		gap: 16px;
		align-items: center;

		@include for-phone-only {
			gap: 8px;
		}
	}
</style>
