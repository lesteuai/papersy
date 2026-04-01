<script lang="ts">
	import Logo from '$lib/components/atoms/Logo.svelte';

	let { showBackground = false } = $props();

	let productsOpen = $state(false);
	let aboutOpen = $state(false);

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.dropdown')) {
			productsOpen = false;
			aboutOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class:has-background={showBackground}>
	<nav class="container">
		<a class="logo" href="/" aria-label="Site logo">
			<Logo />
		</a>

		<div class="links">
			<div class="dropdown">
				<button
					class="dropdown-trigger"
					class:active={productsOpen}
					onclick={() => productsOpen = !productsOpen}
				>
					Products
				</button>
				{#if productsOpen}
					<div class="dropdown-menu">
						<a href="/papersy" onclick={() => productsOpen = false}>Papersy</a>
					</div>
				{/if}
			</div>
			<div class="dropdown">
				<button
					class="dropdown-trigger"
					class:active={aboutOpen}
					onclick={() => aboutOpen = !aboutOpen}
				>
					About
				</button>
				{#if aboutOpen}
					<div class="dropdown-menu">
						<a href="/about" onclick={() => aboutOpen = false}>About</a>
						<a href="/contact" onclick={() => aboutOpen = false}>Contact</a>
					</div>
				{/if}
			</div>
		</div>
	</nav>
</header>

<style lang="scss">
	@use '$lib/scss/breakpoints' as *;

	header {
		position: sticky;
		top: 0;
		z-index: 100;
		// background-color: #eee;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 10px 0;

		&.has-background {
			background: linear-gradient(
				60deg,
				var(--color--waves-start) 0%,
				var(--color--waves-end) 100%
			);
		}

		.container {
			display: flex;
			align-items: center;
			gap: 30px;
		}

		.logo {
			height: 64px;
			flex: 1;
		}

		a {
			color: var(--color--text);
		}

		.links {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 30px;

			a {
				text-decoration: none;
				padding: 10px;
				border-radius: 6px;

				&:hover {
					color: var(--color--primary);
					background-color: rgba(var(--color--primary-rgb), 0.1);
				}
			}
		}

		.dropdown {
			position: relative;

			&-trigger {
				background: none;
				border: none;
				cursor: pointer;
				font: inherit;
				font-size: 1rem;
				color: var(--color--text);
				padding: 10px;
				border-radius: 6px;

				&:hover, &.active {
					color: var(--color--primary);
					background-color: rgba(var(--color--primary-rgb), 0.1);
				}
			}

			&-menu {
				position: absolute;
				top: calc(100% + 6px);
				left: 0;
				background-color: var(--color--card-background);
				border-radius: 8px;
				box-shadow: var(--card-shadow);
				padding: 6px;
				min-width: 140px;

				a {
					display: block;
					padding: 8px 12px;
					border-radius: 6px;
					white-space: nowrap;
				}
			}
		}
	}
</style>
