<script>
	import '$lib/scss/global.scss';
	import Header from '$lib/components/organisms/Header.svelte';
	import { page } from '$app/state';
	import { description, image, keywords, title, siteBaseUrl } from '$lib/data/meta';

	let { children } = $props();

	const segment = $derived(page.url.pathname.slice(1));
	const pageTitle = $derived(
		segment ? `${segment.charAt(0).toUpperCase() + segment.slice(1)} | ${title}` : title
	);
</script>

<svelte:head>
	<link rel="canonical" href={siteBaseUrl} />
	<meta name="keywords" content={keywords.join(', ')} />

	<meta name="description" content={description} />
	<meta property="og:description" content={description} />
	<meta name="twitter:description" content={description} />

	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta name="twitter:title" content={pageTitle} />

	<meta property="og:image" content={image} />
	<meta name="twitter:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
