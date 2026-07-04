# Static Data

Located in `src/lib/data/`. Site-wide constants and metadata used as defaults throughout the app.

## meta.ts

Site-wide SEO/meta constants used as defaults in layout `<svelte:head>` blocks.

| Export | Value |
|---|---|
| `siteBaseUrl` | `'https://sveltekit-static-blog-template.vercel.app/'` |
| `title` | `'SvelteKit Static Blog Template'` |
| `description` | `"A light, neat, and easy-to-use SvelteKit template for your next website."` |
| `keywords` | `['Svelte', 'SvelteKit', 'Template', 'Blog', 'Starter', 'Static Site']` |
| `image` | `'https://sveltekit-static-blog-template.vercel.app//images/site-preview.png'` (note: double slash — trailing slash on `siteBaseUrl`) |
