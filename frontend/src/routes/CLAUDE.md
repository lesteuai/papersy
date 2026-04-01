# src/routes

SvelteKit file-based routing. The entire app is fully prerendered (static output) via `adapter-static`.

---

## Route structure

```
src/routes/
├── +layout.ts          ← export const prerender = true
├── +layout.svelte      ← imports global.scss, renders Header, slot, Footer; sets site-wide meta tags
├── +error.svelte       ← custom error page
│
├── +page.server.ts     ← home page load (returns empty object)
├── +page.svelte        ← home page: Hero, ProblemSolution, ProductShowcase, FeaturePillars, SocialProof, CtaBanner
│
├── about/
│   └── +page.svelte    ← static About page
│
├── contact/
│   └── +page.svelte    ← static Contact page (email link)
│
├── papersy/
│   └── +page.svelte    ← Papersy product detail page (self-contained, no load function)
│
├── blog-posts/
│   └── +page.md        ← slug: "blog-posts"
│
├── customization/
│   └── +page.md        ← slug: "customization"
│
├── project-structure/
│   └── +page.md        ← slug: "project-structure"
│
└── rss.xml/
    └── +server.ts      ← GET endpoint, prerendered to /rss.xml
```

---

## Root layout

**`+layout.ts`** — sets `export const prerender = true` for the entire app.

**`+layout.svelte`** — imports `global.scss`, renders `<Header />`, `<main><slot /></main>`, `<Footer />`. Also sets all site-wide meta tags in `<svelte:head>` (OG title/description/image, Twitter card, canonical, keywords) from `$lib/data/meta`. Page title is derived from the URL segment: `"Segment | Site Title"` for inner pages, just `title` for the home page.

**`+error.svelte`** — renders `Header` (with background), centered error message with the Error illustration icon, a "Start over" link to `/`, and `Footer`.

---

## Home page (`/`)

**`+page.server.ts`** — load function returns an empty object. No data dependencies.

**`+page.svelte`** — landing page for Le Steu AI. Sections in order:
1. `<Hero />` — tagline, subline, single CTA
2. `<ProblemSolution />` — before/after visual: chaos of unread papers vs. clean summary
3. `<ProductShowcase />` — 3-step mock UI (paste paper → summary → Q&A)
4. `<FeaturePillars />` — three hardcoded product pillars: Summarize, Search, Discover
5. `<SocialProof />` — avatar row + trust line
6. `<CtaBanner />` — gradient card with final CTA

---

## Static pages

**`/about`** — company description. Self-contained, no load function. Uses `.container` class and inline SCSS.

**`/contact`** — email contact. Self-contained, no load function.

---

## Product page (`/papersy`)

**`papersy/+page.svelte`** — Papersy product detail page. Fully self-contained (no load function, no shared organism components except `Button`). Sections:
1. Hero — product name, tagline, CTA, beta badge
2. Three capabilities (Summarize / Search / Discover) — icons + detailed descriptions + checklists
3. How it works — 5-step numbered flow
4. Who it's for — 4-persona grid
5. Under the hood — 4 trust-signal items
6. Pricing — single "Beta / Free" card
7. Final CTA

Sections that need full-bleed background use a `<section class="foo">` wrapper with an inner `<div class="container">`. Sections that don't use `<section class="foo container">` directly — **important:** these sections must use `padding-top`/`padding-bottom` rather than the `padding` shorthand, otherwise the shorthand zeros out the horizontal padding provided by `.container`.

---

## Individual post pages

The route structure is pathless — a post at `{slug}/+page.md` is served at `/{slug}`.

**`+layout.server.ts`** load function:
1. Derives slug: `url.pathname.replace('/', '')` → strips leading slash
2. Finds the matching post in `filteredPosts`
3. Returns `{ post: BlogPost }`

**`+layout.svelte`** (article chrome):
- `<svelte:head>`: title `"Post Title - Site Title"`, post excerpt as description, post `coverImage` as OG/Twitter image, merged keywords (`post.tags + post.keywords + site keywords`)
- `<Header showBackground={true} />`
- `<article id="article-content">`: centered header area (title, dates, reading time, tags), optional cover image, 3-column grid content area (middle column 65ch wide; full-bleed elements span all 3)
- Below article: `<RelatedPosts posts={post.relatedPosts} />` (if `post.relatedPosts` exists)
- Background: `--color--post-page-background`

**Adding a new blog post:**
1. Create `src/routes/{slug}/+page.md`
2. Add frontmatter:
   ```yaml
   ---
   title: "Post Title"
   slug: "post-slug"           # must match the folder name
   date: "2024-01-15"
   excerpt: "One sentence summary."
   tags: ['Tag1', 'Tag2']
   keywords: ['keyword1']
   hidden: false
   coverImage: "images/my-cover.jpg"   # optional
   updated: "2024-01-20"               # optional
   ---
   ```
3. The post is auto-discovered by `importPosts` via `import.meta.glob` — no registration needed.

**Inline components in Markdown:**
Import and use Svelte components directly in `.md` files. Current posts use `Callout`, `CodeBlock`, and `Image` from `$lib/components/`.

---

## Maintenance

**Keep this file up to date.** Whenever you add, remove, or restructure a route, route group, layout, or load function under `src/routes/`, update this file. If the change also affects the high-level route architecture description, update the root [CLAUDE.md](../../CLAUDE.md) as well.

---

## RSS endpoint (`rss.xml/+server.ts`)

`export const prerender = true` — outputs a static `/rss.xml` at build time.

GET handler: calls `importPosts(true)` + `filterPosts` directly (independent of the cached module-level exports) to generate a full RSS 2.0 XML feed with `content:encoded` (full HTML in CDATA), categories from tags, and `media:thumbnail`/`media:content` for cover images.
