<script lang="ts">
	import { JobStatus } from '$lib/utils/types';

	type SummaryData = {
		summary: string;
		keyFindings: string[];
		methodology: string;
		limitations: string;
		references: string[];
	};

	let {
		data,
		paperName = undefined,
		jobStatus = undefined,
		error = undefined
	}: { data: SummaryData | null; paperName?: string; jobStatus?: JobStatus; error?: string } = $props();

	function getStatusText(status: JobStatus): string {
		switch (status) {
			case JobStatus.Pending: return 'Queued for processing...';
			case JobStatus.Processing: return 'Processing paper...';
			case JobStatus.Storing: return 'Storing paper...';
			case JobStatus.Cancelled: return 'Cancelled.';
			default: return 'Upload failed.';
		}
	}
</script>

<div class="summary-view">
	{#if data}
		<section class="summary-section">
			<h3>Paper name</h3>
			<p>{paperName}</p>
		</section>
		
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
	{:else if !data && jobStatus && jobStatus !== JobStatus.Done}
		<section class="summary-section">
			<h3>Status</h3>
			<p>{getStatusText(jobStatus)}</p>
		</section>
		{#if error}
			<section class="summary-section">
				<h3>Error</h3>
				<p>{error}</p>
			</section>
		{/if}
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

</style>
