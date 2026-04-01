<section id="product-showcase">
	<div class="heading">
		<h2>See it in action.</h2>
		<p>Paste a paper. Get clarity.</p>
	</div>

	<div class="mock-ui">
		<div class="step input-step">
			<div class="step-label">1: Drop in a paper</div>
			<div class="input-methods">
				<div class="method">
					<span class="method-icon">🔗</span>
					<span class="method-label">Paste a URL</span>
					<span class="method-example">arxiv.org/pdf/1706.03762</span>
				</div>
				<div class="method-divider">or</div>
				<div class="method">
					<span class="method-icon">📄</span>
					<span class="method-label">Upload a PDF</span>
					<span class="method-example">any research paper</span>
				</div>
			</div>
		</div>

		<div class="connector" aria-hidden="true">
			<div class="connector-line"></div>
			<div class="connector-dot"></div>
		</div>

		<div class="step output-step">
			<div class="step-label">2: Get the key points</div>
			<div class="output-card">
				<div class="output-header">
					<span class="paper-title">Attention Is All You Need: Vaswani et al., 2017</span>
					<!-- <span class="read-time">3 min read</span> -->
				</div>
				<ul class="key-points">
					<li>Introduces the Transformer: a model built entirely on attention, no recurrence or convolution</li>
					<li>Achieves state-of-the-art on English-German and English-French translation</li>
					<li>Enables much greater parallelization than RNN-based approaches</li>
				</ul>
			</div>
		</div>

		<div class="connector" aria-hidden="true">
			<div class="connector-line"></div>
			<div class="connector-dot"></div>
		</div>

		<div class="step qa-step">
			<div class="step-label">3: Ask anything about it</div>
			<div class="qa-area">
				<div class="question">
					<span class="q-label">Q</span>
					<span>What are the limitations of this approach?</span>
				</div>
				<div class="answer">
					<span class="a-label">A</span>
					<span>The paper notes that Transformers may struggle with very long sequences due to the quadratic cost of self-attention. The authors acknowledge this is an area for future work.</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	#product-showcase {
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

	.mock-ui {
		width: 100%;
		max-width: 680px;
		display: flex;
		flex-direction: column;
		gap: 0;
		background-color: var(--color--card-background);
		border-radius: 16px;
		box-shadow: var(--card-shadow);
		border: 1px solid rgba(var(--color--primary-rgb), 0.12);
		overflow: hidden;
	}

	.step {
		padding: 24px 28px;

		@include for-phone-only {
			padding: 20px;
		}
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color--primary);
		margin-bottom: 14px;
	}

	.connector {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		height: 28px;
		position: relative;

		.connector-line {
			width: 1px;
			flex: 1;
			background: rgba(var(--color--primary-rgb), 0.25);
			margin: 0 auto;
		}

		.connector-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background-color: var(--color--primary);
			opacity: 0.4;
		}
	}

	// Step 1: Input
	.input-methods {
		display: flex;
		align-items: center;
		gap: 16px;

		@include for-phone-only {
			flex-direction: column;
			gap: 8px;
		}
	}

	.method {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 16px 12px;
		border: 1.5px dashed rgba(var(--color--primary-rgb), 0.3);
		border-radius: 10px;
		background-color: rgba(var(--color--primary-rgb), 0.03);
		text-align: center;

		.method-icon {
			font-size: 1.4rem;
			line-height: 1;
		}

		.method-label {
			font-weight: 700;
			font-size: 0.9rem;
		}

		.method-example {
			font-size: 0.75rem;
			color: var(--color--text-shade);
			opacity: 0.7;
			font-family: monospace;
		}
	}

	.method-divider {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color--text-shade);
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	// Step 2: Output
	.output-card {
		border: 1px solid rgba(var(--color--primary-rgb), 0.15);
		border-radius: 8px;
		padding: 16px;
		background-color: rgba(var(--color--primary-rgb), 0.03);
	}

	.output-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 14px;

		@include for-phone-only {
			flex-direction: column;
		}

		.paper-title {
			font-weight: 700;
			font-size: 0.9rem;
			font-family: var(--font--title);
			line-height: 1.3;
		}

		// .read-time {
		// 	font-size: 0.75rem;
		// 	color: var(--color--text-shade);
		// 	white-space: nowrap;
		// 	padding: 3px 8px;
		// 	background-color: rgba(var(--color--primary-rgb), 0.1);
		// 	border-radius: 20px;
		// }
	}

	.key-points {
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
			line-height: 1.4;

			&::before {
				content: '→';
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

	// Step 3: Q&A
	.qa-area {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.question,
	.answer {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.q-label,
	.a-label {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.q-label {
		background-color: rgba(var(--color--secondary-rgb), 0.15);
		color: var(--color--secondary);
	}

	.a-label {
		background-color: rgba(var(--color--primary-rgb), 0.15);
		color: var(--color--primary);
	}

	.question span:last-child {
		font-weight: 600;
	}

	.answer span:last-child {
		color: var(--color--text-shade);
	}
</style>
