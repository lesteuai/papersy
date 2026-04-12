# src/lib/data

Static site data. All files import via `$lib/data/...`.

---

## Maintenance

**Keep this file up to date.** Whenever you add or change a data file or exported constant in `src/lib/data/`, update the relevant section here. If the change affects the shared library overview (e.g. a new data source or changed export contract), update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## meta.ts

Site-wide SEO/meta constants used as defaults in layout `<svelte:head>` blocks.

| Export | Value |
|---|---|
| `siteBaseUrl` | `'https://sveltekit-static-blog-template.vercel.app/'` |
| `title` | `'SvelteKit Static Blog Template'` |
| `description` | `"A light, neat, and easy-to-use SvelteKit template for your next website."` |
| `keywords` | `['Svelte', 'SvelteKit', 'Template', 'Blog', 'Starter', 'Static Site']` |
| `image` | `'https://sveltekit-static-blog-template.vercel.app//images/site-preview.png'` (note: double slash — trailing slash on `siteBaseUrl`) |

Pages override/compose on top of these. `+layout.svelte` (root) uses all five; individual post pages override `title`, `description`, `image`, and merge `keywords` with per-post values.