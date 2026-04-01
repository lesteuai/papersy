# src/lib/scss

Global SCSS styles. Entry point is `global.scss`, imported once in `src/routes/+layout.svelte`.

---

## Maintenance

**Keep this file up to date.** Whenever you add a new partial, change a theme token (color, breakpoint, variable), modify a mixin signature, or alter the import order in `global.scss`, update the relevant section here. If a change affects how theming is described at the project level, update the root [CLAUDE.md](../../../CLAUDE.md) as well.

---

## Import order (global.scss)

```
_reset.scss
_variables.scss
_themes.scss
_breakpoints.scss
_functions.scss
_mixins.scss
_base.scss
_typography.scss
_markdown.scss
_code-highlights.scss
_animations.scss         ← imported as 'animations.scss' (no underscore) — SCSS resolves it anyway
@fontsource/inter (300, 400, 600)
@fontsource/merriweather (400)
@fontsource/merriweather (900)
@fontsource/ubuntu-mono (400)
```

`global.scss` also emits a small direct block: `body` (background, color, font, transition), `html` (font-size: 18px), `#svelte-root`.

---

## Partials — declarative only (no CSS rules emitted)

### `_variables.scss`
CSS custom properties on `:root`:

| Property | Value |
|---|---|
| `--font--default` | `Inter, sans-serif` |
| `--font--title` | `Merriweather, serif` |
| `--font--mono` | `Ubuntu Mono, monospace` |
| `--ease-3` | `cubic-bezier(0.25, 0, 0.3, 1)` |
| `--ease-4` | `cubic-bezier(0.25, 0, 0.2, 1)` |
| `--ease-out-1` | `cubic-bezier(0, 0, 0.75, 1)` |
| `--ease-out-3` | `cubic-bezier(0, 0, 0.3, 1)` |
| `--ease-elastic-4` | `cubic-bezier(0.5, 1.5, 0.75, 1.25)` |

---

### `_functions.scss`
SCSS function `brightness($color)`: returns a 0–1 perceived brightness value using the W3C formula `((R×0.299) + (G×0.587) + (B×0.114)) / 255`. Used only by `define-color` in `_mixins.scss`.

---

### `_breakpoints.scss`
SCSS breakpoint variables and responsive mixins. All mixins take `@content` only (no parameters).

**Variables:**

| Variable | Value |
|---|---|
| `$breakpoint-iphone-se-max` | `320px` |
| `$breakpoint-phone-max` | `767px` |
| `$breakpoint-tablet-portrait-min` | `768px` |
| `$breakpoint-tablet-portrait-max` | `900px` |
| `$breakpoint-tablet-landscape-min` | `901px` |
| `$breakpoint-tablet-landscape-max` | `1200px` |
| `$breakpoint-desktop-min` | `1201px` |

**Mixins:**

| Mixin | Media query |
|---|---|
| `for-iphone-se` | `max-width: 320px` |
| `for-phone-only` | `max-width: 767px` |
| `for-tablet-portrait-up` | `min-width: 768px` |
| `for-tablet-portrait-down` | `max-width: 900px` |
| `for-tablet-landscape-up` | `min-width: 901px` |
| `for-tablet-landscape-down` | `max-width: 1200px` |
| `for-desktop-up` | `min-width: 1201px` |

---

### `_mixins.scss`
Two mixins. Imports `_breakpoints.scss` and `_functions.scss`.

**`padded-container`** (no params) — responsive centered container:
- Base: `width: 100%; padding: 0 15px; margin: auto`
- ≤320px: no padding
- ≥768px: padding `0 20px`
- ≥901px: padding `0 30px`
- ≥1201px: `max-width: 1080px`

Applied via `.container` class (defined in `_base.scss`).

**`define-color($title, $color)`** — generates a full suite of CSS custom properties for a color:

| Generated property | Content |
|---|---|
| `--color--{title}` | Raw hex/color value |
| `--color--{title}-h` | HSL hue |
| `--color--{title}-s` | HSL saturation |
| `--color--{title}-l` | HSL lightness |
| `--color--{title}-a` | Alpha channel |
| `--color--{title}-rgb` | `R, G, B` comma-separated (for use in `rgba(var(--color--{title}-rgb), 0.3)`) |
| `--color--{title}-contrast` | `var(--color--text)` if brightness > 186, else `var(--color--text-inverse)` |

---

## Partials — emit CSS rules

### `_themes.scss`
Core theming. Defines `base-theme` and `dark-theme` SCSS mixins, then applies them.

**Application selectors:**
```scss
:root { @include base-theme; }
:root[data-theme='dark'] { @include dark-theme; }
:root[data-theme='auto'] { @media (prefers-color-scheme: dark) { @include dark-theme; } }
```

**`base-theme` color tokens (light mode):**

| Name | Hex |
|---|---|
| `primary` | `#6E29E7` |
| `primary-shade` | `#b28cf2` |
| `primary-tint` | `#f9f6fe` |
| `secondary` | `#ff571a` |
| `secondary-shade` | `#ffa280` |
| `secondary-tint` | `#fff8f5` |
| `yellow` | `#ffd400` |
| `text` | `#1c1e26` |
| `text-shade` | `#5d5f65` |
| `text-inverse` | `#ffffff` |
| `text-inverse-shade` | `#9eb4b5` |
| `page-background` | `#f4f8fb` |
| `post-page-background` | `#f3fbfc` |
| `card-background` | `#ffffff` |
| `callout-background` | `#f4f8fb` |
| `callout-background--info` | `#dfeffd` |
| `callout-accent--info` | `#2883f4` |
| `callout-background--warning` | `#fff6b6` |
| `callout-accent--warning` | `#c87820` |
| `callout-background--error` | `#ffe8e8` |
| `callout-accent--error` | `#f95256` |
| `callout-background--success` | `#dcf7ec` |
| `callout-accent--success` | `#009f70` |
| `code-background` | `#1c1e26` |
| `code-text` | `#ffffff` |
| `code-inline-background` | `#e3e3e3` |

Additional raw properties (not via `define-color`):

| Property | Value |
|---|---|
| `--color--waves-start` | `rgba(var(--color--primary-rgb), 0.3)` |
| `--color--waves-end` | `rgba(var(--color--primary-rgb), 0.1)` |
| `--card-shadow` | `0px 4px 10px 0px rgba(0,0,0,0.1)` |
| `--card-shadow-hover` | `0px 4px 10px 8px rgb(0 0 0 / 10%)` |
| `--image-shadow` | `8px 14px 38px rgba(39,44,49,.06), 1px 3px 8px rgba(39,44,49,.03)` |

**`dark-theme` overrides:**

| Name | Hex |
|---|---|
| `primary` | `#9f67ff` |
| `primary-shade` | `#4612A1` |
| `primary-tint` | `#231934` |
| `secondary` | `#ff723f` |
| `secondary-shade` | `#AB3307` |
| `secondary-tint` | `#1b1918` |
| `text` | `#ffffff` |
| `text-shade` | `#9eb4b5` |
| `text-inverse` | `#1c1e26` |
| `text-inverse-shade` | `#5d5f65` |
| `page-background` | `#1c1e26` |
| `post-page-background` | `#141519` |
| `card-background` | `#32343e` |
| `callout-background` | `#1c1e26` |
| `callout-background--info` | `#1d3874` |
| `callout-accent--info` | `#6ca9f7` |
| `callout-background--warning` | `#724413` |
| `callout-accent--warning` | `#ffca39` |
| `callout-background--error` | `#7c1d20` |
| `callout-accent--error` | `#ff8082` |
| `callout-background--success` | `#004737` |
| `callout-accent--success` | `#00c48f` |
| `code-inline-background` | `#2b3131` |

`code-background` and `code-text` are not overridden in dark mode — their light values (`#1c1e26` / `#ffffff`) already work for dark.

---

### `_reset.scss`
Josh Comeau's CSS reset. Targets: `*`, `html`, `body`, media elements, form elements, headings, paragraphs. Key rules: `box-sizing: border-box`, `margin: 0`, font smoothing, `isolation: isolate` on `#root`/`#__next`.

---

### `_base.scss`
`.container` class (applies `padded-container` mixin). List styles: `ul/ol` margin + padding, `li` margin, `li::marker` colored `var(--color--primary)`.

---

### `_typography.scss`
Global type styles:
- `a`: inherits color, primary-colored underline, `text-underline-offset` animates on hover (`0.1em` → `0.3em`)
- `::selection`: `rgba(var(--color--primary-rgb), 0.3)` background
- `h1`: `2.5rem / 700` (→ `2rem` on phone)
- `h2`: `1.8rem / 600`
- `h3`: `1.5rem / 600`
- `h4`: `1.2rem`
- `h5`: `1rem`
- All `h1`–`h5`: `font-family: var(--font--title)` (Merriweather)

---

### `_markdown.scss`
All rules scoped under `#article-content` (the blog post article element).

Key scoped rules under `.content`:
- `p`: `margin: 0.75rem 0; line-height: 1.55em`
- `h2`: `margin: 3rem 0 0.5rem`
- `h3/h4`: `margin: 2rem 0 0.3rem`
- `img`: centered block, `max-width: 100%`, `box-shadow: var(--image-shadow)`, `margin: 2rem auto`
- `figcaption`: `0.85rem`, centered, semi-transparent; pulled up when following `img`
- `blockquote`: `border-radius: 20px`, left `4px solid var(--color--primary)`, callout background
- `code:not([class^='language-'])` (inline code): `var(--color--code-inline-background)` bg, `padding: 5px 10px`, `border-radius: 5px`
- `a:not(.button):hover`: primary drop-shadow glow
- `.heading-link`: primary color, no underline, `margin-right: 10px`

Also: `#article-content img` gets `border-radius: 6px` (applies outside `.content` too, e.g. cover images).

---

### `_code-highlights.scss`
Prism.js syntax theme (Material Palenight style). **All token colors are hardcoded — they do not respond to light/dark theming.** The full `pre[class*="language-"]` styling block at the top is commented out (background, padding, etc.) — those are handled by `CodeBlock.svelte` instead.

Key token colors: comments `rgb(99,119,119)`, punctuation `rgb(199,146,234)`, keywords `rgb(127,219,202)`, strings/inserted `rgb(173,219,103)`, functions `rgb(130,170,255)`, booleans `rgb(255,88,116)`, numbers `rgb(247,140,108)`.

---

### `_animations.scss`
Defines two `@keyframes` only (no selectors):

**`svg-text-stroke`**: SVG text stroke draw-on effect. Steps from `fill: transparent` + stroke animation to `fill: var(--text-color)` + no stroke. Note: uses `var(--text-color)` — inconsistent with the rest of the codebase which uses `var(--color--text)`.

**`spin`**: `from: rotate(0turn)` → `to: rotate(1turn)`.

---

## Architecture notes

1. **Theming is entirely CSS-driven** — switching the `data-theme` attribute on `<html>` is all that's needed. No JS class toggling.

2. **RGB tuple pattern** — `define-color` generates `--color--{name}-rgb` as `R, G, B` so it can be used in: `rgba(var(--color--primary-rgb), 0.3)`. This is the canonical way to create semi-transparent versions of theme colors.

3. **`--color--` prefix convention** — all semantic color variables use this double-dash + category prefix. The one exception is `var(--text-color)` in `svg-text-stroke` (legacy inconsistency).

4. **Breakpoint mixins are content-agnostic** — each is a named mixin taking only `@content`. Always use the named mixin (e.g. `@include for-phone-only`) rather than writing media queries by hand.
