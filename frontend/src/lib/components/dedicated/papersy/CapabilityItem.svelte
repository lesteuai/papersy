<script>
	let { title, description, items, icon } = $props();
</script>

<div class="capability">
	<div class="cap-icon">
		{@render icon?.()}
	</div>
	<div class="cap-content">
		<h3>{title}</h3>
		<p>{description}</p>
		<ul>
			{#each items as item}
				<li>{item}</li>
			{/each}
		</ul>
	</div>
</div>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	.capability {
		display: grid;
		grid-template-columns: 56px 1fr;
		gap: 24px;
		align-items: flex-start;

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}

	.cap-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background-color: rgba(var(--color--primary-rgb), 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--primary);
		flex-shrink: 0;

		:global(svg) {
			width: 24px;
			height: 24px;
		}
	}

	.cap-content {
		h3 {
			margin-bottom: 10px;
		}

		p {
			color: var(--color--text-shade);
			line-height: 1.65;
			margin-bottom: 14px;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 6px;

			li {
				font-size: 0.9rem;
				color: var(--color--text-shade);
				padding-left: 18px;
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
	}
</style>
