<section id="social-proof">
	<div class="avatars">
		<div class="avatar" style="background-color: #b28cf2;" aria-hidden="true">A</div>
		<div class="avatar" style="background-color: #ffa280;" aria-hidden="true">R</div>
		<div class="avatar" style="background-color: #80c8ff;" aria-hidden="true">M</div>
		<div class="avatar" style="background-color: #b2e6c8;" aria-hidden="true">S</div>
		<div class="avatar" style="background-color: #ffd480;" aria-hidden="true">L</div>
	</div>
	<p class="trust-line">
		Trusted by researchers at <strong>Oregon State University</strong> and beyond.
	</p>
</section>

<style lang="scss">
	#social-proof {
		padding: 40px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.avatars {
		display: flex;
		align-items: center;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		font-weight: 700;
		color: #1c1e26;
		border: 2px solid var(--color--page-background);
		margin-left: -10px;

		&:first-child {
			margin-left: 0;
		}
	}

	.trust-line {
		font-size: 0.95rem;
		color: var(--color--text-shade);
		text-align: center;

		strong {
			color: var(--color--text);
		}
	}
</style>
