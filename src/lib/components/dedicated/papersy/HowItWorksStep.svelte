<script>
	let { number, title, description, connector = false } = $props();
</script>

<div class="step">
	<div class="step-number">{number}</div>
	<div class="step-body">
		<h4>{title}</h4>
		<p>{description}</p>
	</div>
</div>
{#if connector}
	<div class="step-connector" aria-hidden="true"></div>
{/if}

<style lang="scss">
	.step {
		display: grid;
		grid-template-columns: 40px 1fr;
		gap: 20px;
		align-items: flex-start;

		h4 {
			margin-bottom: 4px;
		}

		p {
			font-size: 0.95rem;
			color: var(--color--text-shade);
			line-height: 1.55;
			margin: 0;
		}
	}

	.step-number {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: rgba(var(--color--primary-rgb), 0.1);
		color: var(--color--primary);
		font-weight: 700;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.step-connector {
		width: 1px;
		height: 24px;
		background-color: rgba(var(--color--primary-rgb), 0.2);
		margin-left: 18px;
	}
</style>
