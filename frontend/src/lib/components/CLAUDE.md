# src/lib/components

Components organized by Atomic Design: `atoms/` → `molecules/` → `organisms/`. Higher layers compose lower layers; lower layers have no upward dependencies.

A fourth tier, `dedicated/`, holds page-specific components that are too specialized for the generic atomic layers but still live in `$lib` for co-location with the rest of the component system.

Import via `$lib/components/{layer}/ComponentName.svelte` or `$lib/components/dedicated/{page}/ComponentName.svelte`.

---

## Maintenance

**Keep this file up to date.** Whenever you add, remove, rename, or change the props/slots/behavior of a component under `src/lib/components/`, update the relevant entry in this file (Quick Reference table + the per-component detail section). If a change affects the shared library overview, update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## Quick Reference

| Component | Layer | Props | Named Slots | Composes |
|---|---|---|---|---|
| Capabilities | dedicated/papersy | — | — | CapabilityItem |
| CapabilityItem | dedicated/papersy | title, description, items: string[] | `icon` | — |
| HowItWorks | dedicated/papersy | — | — | HowItWorksStep |
| HowItWorksStep | dedicated/papersy | number, title, description, connector?: boolean | — | — |
| ForWho | dedicated/papersy | — | — | PersonaCard |
| PersonaCard | dedicated/papersy | emoji, title, description | — | — |
| TechSection | dedicated/papersy | — | — | TechSectionItem |
| TechSectionItem | dedicated/papersy | title, description | — | — |
| Pricing | dedicated/papersy | — | — | PricingCard |
| PricingCard | dedicated/papersy | planName, price, description, features: string[], ctaLabel, ctaHref | — | Button |
| Button | atom | color, style, size, href, additionalClass, target, rel | `icon` | — |
| Card | atom | additionalClass, href, target, rel | `image`, `content`, `footer` | — |
| Image | atom | src, alt, fullBleed, formats, widths | — | — |
| Logo | atom | animated | — | — |
| RssLink | atom | — | — | RssIcon |
| Tag | atom | color | default | — |
| BlogPostCard | molecule | title, coverImage, excerpt, slug, tags, readingTime, showImage | — | Card, Tag, Image |
| Callout | molecule | type | default | Alert/Check/Info icons |
| CodeBlock | molecule | filename, lang, fullBleed | default | — |
| FeatureCard | molecule | name, description, image, tags | — | Card, Tag, Image |
| MarkerHighlight | molecule | color | default | — |
| Socials | molecule | — | — | Social icons |
| TextPage | molecule | title | default | — |
| ThemeToggle | molecule | — | — | theme store |
| TintHighlight | molecule | color | default | — |
| About | organism | — | — | Socials, Image |
| ContentSection | organism | id, title, description, align | `button`, default | — |
| CtaBanner | organism | — | — | Button |
| FeaturePillars | organism | — | — | — |
| Features | organism | features: Feature[] | — | FeatureCard, ContentSection |
| Footer | organism | — | — | Socials, ThemeToggle, RssLink |
| Header | organism | showBackground | — | Logo, ThemeToggle, RssLink |
| Hero | organism | title, tagline, ctaLabel, ctaHref, subline | — | Button |
| ProblemSolution | organism | — | — | — |
| ProductShowcase | organism | — | — | — |
| RecentPosts | organism | posts: BlogPost[] | — | BlogPostCard, ContentSection, Button |
| RelatedPosts | organism | posts: BlogPost[] | — | BlogPostCard, ContentSection |
| SocialProof | organism | — | — | — |
| Waves | organism | — | — | — |

---

## Atoms

### Button
Polymorphic: renders as `<a>` when `href` is provided, `<button>` otherwise (via `<svelte:element>`).

| Prop | Type | Default |
|---|---|---|
| `color` | `'primary' \| 'secondary'` | `'primary'` |
| `style` | `'solid' \| 'understated' \| 'clear'` | `'solid'` |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `href` | `string \| undefined` | `undefined` |
| `additionalClass` | `string \| undefined` | `undefined` |
| `target` | `'_self' \| '_blank'` | auto: `'_blank'` for external URLs |
| `rel` | `string \| undefined` | auto: `'noopener noreferrer'` for external URLs |

Slots: `icon` (named, 24px wrapper), default (label text).
CSS classes: `.button.style--{solid|understated|clear}.size--{small|medium|large}.color--{primary|secondary}`.
External URL detection uses `HttpRegex` from `$lib/utils/regex`.
Forwards `on:click` and `$$restProps`. Sets `data-sveltekit-preload-data`.

---

### Card
Generic container. Renders as `<a>` when `href` provided, `<article>` otherwise.

| Prop | Type | Default |
|---|---|---|
| `additionalClass` | `string \| undefined` | `undefined` |
| `href` | `string \| undefined` | `undefined` |
| `target` | `'_self' \| '_blank'` | auto |
| `rel` | `string \| undefined` | auto |

Slots: `image` (fills left side, `flex: 1 0 max(50%, 330px)`, min-height 280px), `content`, `footer`.
Hover: `scale(1.01)` + elevated shadow only when `[href]` or `[onclick]` is present.
Images in the `image` slot are forced to `position: absolute; width/height: 100%; object-fit: cover` via `:global`.

---

### Image
Responsive `<img>` with optional multi-format srcset.

| Prop | Type | Default |
|---|---|---|
| `src` | `string` | required |
| `alt` | `string` | required |
| `fullBleed` | `boolean \| undefined` | `undefined` |
| `formats` | `string[]` | `['avif', 'webp', 'png']` |
| `widths` | `string[] \| undefined` | `undefined` |

In `dev` mode, srcset is skipped entirely. If `widths` provided: width-descriptor srcset. Otherwise: format-only srcset.
`fullBleed` adds `.full-bleed` class.

---

### Logo
Inline SVG of the text "Site Logo" (replace with actual logo). Uses YoungSerif font via SVG text.

| Prop | Type | Default |
|---|---|---|
| `animated` | `boolean` | `true` |

When `animated: true` and `prefers-reduced-motion: no-preference`: plays `svg-text-stroke` keyframe on mount (stroke-draw-on effect).

---

### RssLink
No props. Anchor to `/rss.xml` (opens `_blank`) with RSS icon. Hover glow in primary color.

---

### Tag
Pill-shaped label badge.

| Prop | Type | Default |
|---|---|---|
| `color` | `'primary' \| 'secondary'` | `'primary'` |

Default slot — label text.
Primary: purple-tinted background. Secondary: orange-tinted.
CSS: `.tag.primary` / `.tag.secondary` (direct class, not BEM modifier).

---

## Molecules

### BlogPostCard
Post card linking to `/{slug}`. Built on `Card`.

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | required |
| `excerpt` | `string` | required |
| `slug` | `string` | required |
| `coverImage` | `string \| undefined` | `undefined` |
| `tags` | `string[] \| undefined` | — |
| `readingTime` | `string \| undefined` | `undefined` |
| `showImage` | `boolean` | `true` |

Shows max 2 tags (`tags.slice(0, 2)`). Passes `additionalClass='no-image'` to Card when image is suppressed (hides the image slot via CSS).

---

### Callout
Alert/callout block for use inside Markdown content.

| Prop | Type | Default |
|---|---|---|
| `type` | `'info' \| 'warning' \| 'error' \| 'success' \| undefined` | `undefined` |

Default slot — body content.
Left-border accent (`4px solid var(--accent-color)`). Icon badge positioned at top-left corner.
Icon selection: `info` → Info, `warning`/`error` → Alert, `success` → Check. No icon if `type` is undefined.

---

### CodeBlock
Wrapper for syntax-highlighted code blocks, used by the MDsveX pipeline.

| Prop | Type | Default |
|---|---|---|
| `filename` | `string` | required |
| `lang` | `string` | required |
| `fullBleed` | `boolean \| undefined` | `undefined` |

Default slot — the `<pre>` content. Both `filename` and `lang` only render if truthy. Primary-color styled scrollbar on `<pre>`.

---

### FeatureCard
Feature card, non-clickable. Built on `Card`.

| Prop | Type |
|---|---|
| `name` | `string` |
| `description` | `string` |
| `image` | `string` |
| `tags` | `TagType[] \| undefined` |

Note: uses `TagType` (with `.color` field), unlike `BlogPostCard` which uses plain `string[]` for tags.

---

### MarkerHighlight
Inline `<mark>` styled as a hand-drawn ink marker. Three-gradient technique for tapered ends. `box-decoration-break: clone` for multi-line support.

| Prop | Type | Default |
|---|---|---|
| `color` | `'primary' \| 'secondary'` | `'primary'` |

---

### Socials
Row of 5 social icon links (Telegram, Mastodon, GitHub, LinkedIn, Email). All `href`s are currently `"#"` — replace with real URLs. Opens all in `_blank`.

---

### TextPage
Generic text page layout. Centered column, `max-width: 720px`, used by `/about` and `/contact`.

| Prop | Type |
|---|---|
| `title` | `string` |

Default slot — page body content (paragraphs, links, etc.).

---

### ThemeToggle
No props. Button cycling `auto → light → dark → auto`. Reads/writes the `theme` store.
Morphing sun/moon SVG — driven by `[data-theme]` attribute selectors in CSS.
Hidden via `<noscript>` when JS is disabled.

---

### TintHighlight
Simpler inline `<mark>`. Single gradient from `transparent` (top 60%) to `--color--{color}-tint` (bottom 40%).

| Prop | Type | Default |
|---|---|---|
| `color` | `'primary' \| 'secondary' \| string` | `'primary'` |

Color injected as inline `style` attribute.

---

## Organisms

### About
Two-column section (500px + 250px, collapses to 1 col on mobile). Left: heading + body text + `Socials`. Right: `Image`. All content hardcoded — edit directly to customize.

---

### ContentSection
Generic section layout wrapper.

| Prop | Type | Default |
|---|---|---|
| `id` | `string \| undefined` | `undefined` |
| `title` | `string \| undefined` | `undefined` |
| `description` | `string \| undefined` | `undefined` |
| `align` | `'left' \| 'top' \| 'right'` | `'top'` |

Slots: `button` (named, inside title area, only rendered if used), default (content area).
`left`/`right`: title and content side by side (flex row), title-area `flex: 2`, content-area `flex: 5`.
`top`: flex column, title area capped at 600px.
`.title-area` only renders if `title || description`.

---

### Features
Features grid inside `ContentSection`. Hardcoded title "Features".

| Prop | Type |
|---|---|
| `features` | `Feature[]` |

CSS grid pattern: every 3rd-group's 2nd item spans 2 rows (desktop); every 3rd-group's 1st item spans 2 columns (1085px and below). Collapses to 1 column on mobile.

---

### Footer
Fixed-height (340px) footer. Gradient wave background (`--color--waves-start` → `--color--waves-end`). `FooterWave` SVG at top. Contains `Socials`, `RssLink`, `ThemeToggle`. No props.

---

### Header
Sticky top nav.

| Prop | Type | Default |
|---|---|---|
| `showBackground` | `boolean` | `false` |

`showBackground: true` applies the diagonal gradient background (used on blog article pages).
Nav text links (`<a>` tags inside `.links`) are hidden on mobile — only icon components remain visible.

---

### Hero
Product/landing page hero. Flex column, centered, used on home and `/papersy`.

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | required |
| `tagline` | `string` | required |
| `ctaLabel` | `string` | required |
| `ctaHref` | `string` | required |
| `subline` | `string \| undefined` | `undefined` |

---

### ProblemSolution
Two-panel before/after section. Left panel ("Before"): red-tinted overflow badge, list of 6 truncated paper titles with a bottom fade-out. Right panel ("With Papersy"): primary-tinted badge, a clean `summary-card` with a checkmark list. Panels connected by an SVG arrow divider. On mobile, stacks vertically with the arrow rotated 90°. No props — edit directly.

---

### ProductShowcase
3-step mock UI showing the product pipeline. Step 1: text input field + "Summarize" button. Step 2: output card with paper title, read-time badge, and bullet-point key points. Step 3: Q&A pair with colored avatar labels (Q/A). Steps connected by `connector` elements (line + dot). Centered, max-width 680px. No props — edit directly.

---

### FeaturePillars
Three equal-width product pillar cards in a CSS grid (3-col desktop → 1-col mobile). Each pillar has an inline SVG icon in a rounded container, an `h3`, and a `p`. Content is hardcoded (Summarize / Search / Discover). No props — edit directly.

---

### SocialProof
Minimal trust signal. Row of 5 overlapping avatar circles (hardcoded initials + background colors) + a one-line trust statement. No props — edit directly to update the university name or avatar count.

---

### CtaBanner
Full-width gradient CTA card. Primary-color gradient background, `h2` headline, `p` subline ("Free during beta"), and a single primary `Button` linking to `/contact`. No props — edit directly.

---

### RecentPosts
2-column grid of the 4 most recent posts inside `ContentSection` (`align="left"`). "View More" button links to `/blog`. All cards rendered with `showImage={false}`.

| Prop | Type |
|---|---|
| `posts` | `BlogPost[]` |

---

### RelatedPosts
3-column grid (2-col on medium, 1-col on mobile) of related posts. Used at the bottom of blog article pages. All cards `showImage={false}`.

| Prop | Type |
|---|---|
| `posts` | `BlogPost[]` |

---

### Waves
Decorative animated SVG wave background. Absolutely positioned, `height: min(65vh, 500px)`. Four wave layers with staggered animation durations (7s, 10s, 13s, 20s). Animation disabled under `prefers-reduced-motion: reduce`. No props.

---

## Dedicated

Page-specific components under `dedicated/{page}/`. Not intended for reuse across pages. Import via `$lib/components/dedicated/{page}/ComponentName.svelte`.

### dedicated/papersy

All section and item components for the `/papersy` product page.

**Section components** (no props, content hardcoded — edit directly):

| Component | Description | Composes |
|---|---|---|
| `Capabilities` | 2-column capability grid with icon, title, description, and checklist per item | `CapabilityItem` |
| `HowItWorks` | Numbered vertical step list with connectors between steps | `HowItWorksStep` |
| `ForWho` | 4-card persona grid (emoji + title + description) | `PersonaCard` |
| `TechSection` | 3-item trust/tech grid | `TechSectionItem` |
| `Pricing` | Single pricing card section | `PricingCard` |

**Item components** (driven by props from their parent section):

#### CapabilityItem
| Prop | Type |
|---|---|
| `title` | `string` |
| `description` | `string` |
| `items` | `string[]` |

Slot: `icon` (named) — renders the SVG icon inside a 48px rounded container.

#### HowItWorksStep
| Prop | Type | Default |
|---|---|---|
| `number` | `number` | required |
| `title` | `string` | required |
| `description` | `string` | required |
| `connector` | `boolean` | `false` |

When `connector` is `true`, renders a `.step-connector` divider after the step body (used between all steps except the last).

#### PersonaCard
| Prop | Type |
|---|---|
| `emoji` | `string` |
| `title` | `string` |
| `description` | `string` |

#### TechSectionItem
| Prop | Type |
|---|---|
| `title` | `string` |
| `description` | `string` |

#### PricingCard
Composes `Button`.

| Prop | Type |
|---|---|
| `planName` | `string` |
| `price` | `string` |
| `description` | `string` |
| `features` | `string[]` |
| `ctaLabel` | `string` |
| `ctaHref` | `string` |

Feature list items render inline (no sub-component) — each `<li>` has a `✓` pseudo-element bullet.
