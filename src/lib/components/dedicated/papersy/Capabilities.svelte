<script>
	import CapabilityItem from './CapabilityItem.svelte';
</script>

<section class="capabilities">
	<div class="container">
		<h2>Things Papersy does well.</h2>
		<div class="capability-grid">
			<CapabilityItem
				title="Summarize"
				description="Fast, structured summaries: what they did, what they found, and what the caveats are. Every summary follows the same clear structure so you can compare papers at a glance."
				items={[
					'Method overview in plain language',
					'Key results with numbers preserved',
					'Limitations and open questions'
				]}
			>
				{#snippet icon()}
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M9 12h6M9 8h6M9 16h4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				{/snippet}
			</CapabilityItem>

			<CapabilityItem
				title="Search"
				description="Ask any question about the paper in plain English. Papersy gives you a precise answer grounded in the actual text, not a guess. Every answer is traceable back to the source, so you always know where it came from."
				items={[
					'Natural language Q&A on any paper',
					'Answers grounded in the source text',
					"If it's not in the paper, Papersy says so"
				]}
			>
				{#snippet icon()}
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75"/>
						<path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
					</svg>
				{/snippet}
			</CapabilityItem>

			<!-- <CapabilityItem
				title="Discover"
				description="Every paper is a node in a wider conversation. Papersy shows you that conversation: what came before, what came after, and what's running in parallel."
				items={[
					'Related work surfaced automatically',
					'Grouped by theme, not just by citation count',
					'Follow a research thread without losing hours to Google Scholar'
				]}
			>
				<svg slot="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 2l1.8 5.4H19l-4.4 3.2 1.7 5.2L12 13l-4.3 2.8 1.7-5.2L5 7.4h5.2L12 2z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M5 19h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
					<path d="M8 22h8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
				</svg>
			</CapabilityItem> -->
		</div>
	</div>
</section>

<style lang="scss">
	.capabilities {
		padding: 70px 0;
		background-color: rgba(var(--color--primary-rgb), 0.03);
		border-top: 1px solid rgba(var(--color--primary-rgb), 0.08);
		border-bottom: 1px solid rgba(var(--color--primary-rgb), 0.08);

		h2 {
			margin-bottom: 40px;
		}
	}

	.capability-grid {
		display: flex;
		flex-direction: column;
		gap: 48px;
	}
</style>
