<script>
	import Button from '$lib/components/atoms/Button.svelte';

	let { planName, price, description, features, ctaLabel, ctaHref } = $props();
</script>

<div class="pricing-card">
	<div class="pricing-top">
		<span class="plan-name">{planName}</span>
		<span class="plan-price">{price}</span>
	</div>
	<p class="plan-desc">{description}</p>
	<ul class="plan-features">
		{#each features as feature}
			<li>{feature}</li>
		{/each}
	</ul>
	<Button color="primary" size="large" href={ctaHref}>{ctaLabel}</Button>
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.pricing-card {
		max-width: 480px;
		background-color: var(--color--card-background);
		border-radius: 16px;
		padding: 36px;
		box-shadow: var(--card-shadow);
		border: 1px solid rgba(var(--color--primary-rgb), 0.15);
		display: flex;
		flex-direction: column;
		gap: 20px;

		@include for-phone-only {
			padding: 24px;
		}
	}

	.pricing-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.plan-name {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color--primary);
		background-color: rgba(var(--color--primary-rgb), 0.1);
		padding: 4px 10px;
		border-radius: 20px;
	}

	.plan-price {
		font-size: 2rem;
		font-weight: 700;
		font-family: var(--font--title);
	}

	.plan-desc {
		font-size: 0.95rem;
		color: var(--color--text-shade);
		line-height: 1.55;
		margin: 0;
	}

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;

		li {
			font-size: 0.95rem;
			padding-left: 22px;
			position: relative;

			&::before {
				content: '✓';
				position: absolute;
				left: 0;
				color: var(--color--primary);
				font-weight: 700;
			}

			&::marker {
				display: none;
			}
		}
	}
</style>
