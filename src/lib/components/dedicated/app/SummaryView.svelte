<script lang="ts">
	type SummaryData = {
		summary: string;
		keyFindings: string[];
		methodology: string;
		limitations: string;
		references: string[];
	};

	let { data, error = undefined }: { data: SummaryData | null; error?: string } = $props();
</script>

<div class="summary-view">
	{#if data}
		<section class="summary-section">
			<h3>Summary</h3>
			<p>{data.summary}</p>
		</section>

		<section class="summary-section">
			<h3>Key Findings</h3>
			<ul>
				{#each data.keyFindings as finding, idx (idx)}
					<li>{finding}</li>
				{/each}
			</ul>
		</section>

		<section class="summary-section">
			<h3>Methodology</h3>
			<p>{data.methodology}</p>
		</section>

		<section class="summary-section">
			<h3>Limitations</h3>
			<p>{data.limitations}</p>
		</section>

		<section class="summary-section">
			<h3>List of References</h3>
			<ul>
				{#each data.references as ref, idx (idx)}
					<li>{ref}</li>
				{/each}
			</ul>
		</section>
	{:else if error}
		<div class="error-state">
			<p class="error-message">Upload failed: {error}</p>
		</div>
	{:else}
		<div class="placeholder">
			<p>Summary will appear here once the paper is processed.</p>
		</div>
	{/if}
</div>

<style lang="scss">
	.summary-view {
		flex: 1;
		overflow-y: auto;
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.summary-section {
		h3 {
			font-size: 1rem;
			font-weight: 600;
			color: var(--color--primary);
			margin-bottom: 8px;
		}

		p {
			font-size: 0.95rem;
			line-height: 1.65;
			color: var(--color--text);
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 6px;

			li {
				font-size: 0.95rem;
				line-height: 1.55;
				color: var(--color--text);
				padding-left: 16px;
				position: relative;

				&::before {
					content: '-';
					position: absolute;
					left: 0;
					color: var(--color--text-shade);
				}
			}
		}
	}

	.placeholder {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;

		p {
			font-size: 0.9rem;
			color: var(--color--text-shade);
		}
	}

	.error-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background-color: var(--color--callout-background--error);
		border-radius: 6px;
		margin: 20px;

		.error-message {
			font-size: 0.95rem;
			color: var(--color--callout-accent--error);
			text-align: center;
			margin: 0;
		}
	}
</style>
