<section id="problem-solution">
	<div class="heading">
		<h2>Researchers drown in papers.</h2>
		<p>We surface what matters.</p>
	</div>

	<div class="panels">
		<div class="panel before">
			<div class="panel-label">Before</div>
			<div class="panel-badge overflow">47 unread papers</div>
			<ul class="paper-list">
				<li>A Novel Transformer Architecture for Multi-Modal Learning in...</li>
				<li>Revisiting Attention Mechanisms: An Empirical Study Across...</li>
				<li>Scalable Diffusion Models with State Space Representations...</li>
				<li>Towards Efficient In-Context Learning: Benchmarks and...</li>
				<li>Cross-Lingual Transfer in Low-Resource Scenarios Using...</li>
				<li>Self-Supervised Pre-Training for Biomedical Text Mining...</li>
			</ul>
			<div class="fade-out"></div>
		</div>

		<div class="divider" aria-hidden="true">
			<svg viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8 40 L32 40 M22 28 L32 40 L22 52" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>

		<div class="panel after">
			<div class="panel-label">With Papersy</div>
			<div class="panel-badge clear">Summaries and highlights</div>
			<div class="summary-card">
				<div class="summary-title">A Novel Transformer Architecture for...</div>
				<ul class="summary-points">
					<li>Proposes a new attention variant that cuts memory use by 40%</li>
					<li>Outperforms baselines on 6 of 8 benchmarks</li>
					<li>Key limitation: only tested on English-language datasets</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	#problem-solution {
		padding: 60px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 50px;
	}

	.heading {
		text-align: center;

		h2 {
			margin-bottom: 8px;
		}

		p {
			font-size: 1.2rem;
			color: var(--color--text-shade);
		}
	}

	.panels {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 20px;
		align-items: center;
		width: 100%;
		max-width: 860px;

		@include for-phone-only {
			grid-template-columns: 1fr;
		}
	}

	.divider {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--primary);
		width: 40px;

		svg {
			width: 40px;
			height: 80px;
		}

		@include for-phone-only {
			transform: rotate(90deg);
			margin: 0 auto;
		}
	}

	.panel {
		border-radius: 12px;
		padding: 24px;
		position: relative;
		overflow: hidden;
		min-height: 260px;

		&.before {
			background-color: rgba(var(--color--secondary-rgb), 0.06);
			border: 1px solid rgba(var(--color--secondary-rgb), 0.2);

			.paper-list {
				list-style: none;
				padding: 0;
				margin: 0;
				display: flex;
				flex-direction: column;
				gap: 10px;

				li {
					font-size: 0.85rem;
					color: var(--color--text-shade);
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					padding: 8px 10px;
					background-color: var(--color--card-background);
					border-radius: 6px;
					border-left: 3px solid rgba(var(--color--secondary-rgb), 0.4);

					&::marker {
						display: none;
					}
				}
			}

			.fade-out {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 80px;
				background: linear-gradient(to bottom, transparent, rgba(var(--color--secondary-rgb), 0.06));
				pointer-events: none;
			}
		}

		&.after {
			background-color: rgba(var(--color--primary-rgb), 0.05);
			border: 1px solid rgba(var(--color--primary-rgb), 0.2);
		}
	}

	.panel-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color--text-shade);
		margin-bottom: 12px;
	}

	.panel-badge {
		display: inline-block;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 20px;
		margin-bottom: 16px;

		&.overflow {
			background-color: rgba(var(--color--secondary-rgb), 0.15);
			color: var(--color--secondary);
		}

		&.clear {
			background-color: rgba(var(--color--primary-rgb), 0.12);
			color: var(--color--primary);
		}
	}

	.summary-card {
		background-color: var(--color--card-background);
		border-radius: 8px;
		padding: 16px;
		box-shadow: var(--card-shadow);

		.summary-title {
			font-weight: 700;
			font-size: 0.95rem;
			margin-bottom: 12px;
			font-family: var(--font--title);
		}

		.summary-points {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 8px;

			li {
				font-size: 0.875rem;
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
