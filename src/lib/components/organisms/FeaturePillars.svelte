<section id="feature-pillars">
	<div class="heading">
		<h2>Everything you need to read smarter.</h2>
	</div>

	<div class="pillars">
		<div class="pillar">
			<div class="icon">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M9 12h6M9 8h6M9 16h4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<h3>Summarize</h3>
			<p>Drop in any paper. Get the key points: method, results, and limitations within in seconds.</p>
		</div>

		<div class="pillar">
			<div class="icon">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75"/>
					<path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
				</svg>
			</div>
			<h3>Search</h3>
			<p>Ask questions in plain English. Get precise answers grounded in the paper's actual content.</p>
		</div>

		<div class="pillar">
			<div class="icon">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 2l1.8 5.4H19l-4.4 3.2 1.7 5.2L12 13l-4.3 2.8 1.7-5.2L5 7.4h5.2L12 2z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M5 19h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
					<path d="M8 22h8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
				</svg>
			</div>
			<h3>Discover</h3>
			<p>Surface related work you didn't know to look for. Follow threads across the literature automatically.</p>
		</div>
	</div>
</section>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	#feature-pillars {
		padding: 60px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 50px;
	}

	.heading {
		text-align: center;

		h2 {
			max-width: 560px;
		}
	}

	.pillars {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		width: 100%;

		@include for-tablet-portrait-down {
			grid-template-columns: 1fr;
			max-width: 480px;
		}
	}

	.pillar {
		background-color: var(--color--card-background);
		border-radius: 14px;
		padding: 28px 24px;
		box-shadow: var(--card-shadow);
		border: 1px solid rgba(var(--color--primary-rgb), 0.08);
		display: flex;
		flex-direction: column;
		gap: 14px;

		h3 {
			font-size: 1.2rem;
		}

		p {
			font-size: 0.95rem;
			color: var(--color--text-shade);
			line-height: 1.55;
			margin: 0;
		}
	}

	.icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background-color: rgba(var(--color--primary-rgb), 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color--primary);

		svg {
			width: 22px;
			height: 22px;
		}
	}
</style>
