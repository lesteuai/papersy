# SCSS & Styling

Global SCSS styles. Entry point is `global.scss`, imported once in `src/routes/+layout.svelte`.

## Import Order (global.scss)

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
_animations.scss         <- imported as 'animations.scss' (no underscore) — SCSS resolves it anyway
@fontsource/inter (300, 400, 600)
@fontsource/merriweather (400)
@fontsource/merriweather (900)
@fontsource/ubuntu-mono (400)
```

`global.scss` also emits a small direct block: `body` (background, color, font, transition), `html` (font-size: 18px), `#svelte-root`.

## Partials — Declarative Only (No CSS Rules Emitted)

### _variables.scss

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

### _functions.scss

SCSS function `brightness($color)`: returns a 0–1 perceived brightness value using the W3C formula `((R×0.299) + (G×0.587) + (B×0.114)) / 255`. Used only by `define-color` in `_mixins.scss`.

### _breakpoints.scss

SCSS breakpoint variables and responsive mixins.

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

### _mixins.scss

Two mixins. Imports `_breakpoints.scss` and `_functions.scss`.

**`padded-container`** (no params) — responsive centered container:
- Base: `width: 100%; padding: 0 15px; margin: auto`
- <=320px: no padding
- >=768px: padding `0 20px`
- >=901px: padding `0 30px`
- >=1201px: `max-width: 1080px`

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

## Partials — Emit CSS Rules

### _themes.scss

Core theming. Defines `base-theme` and `dark-theme` SCSS mixins, then applies them.

**Application selectors:**
```scss
:root { @include base-theme; }
:root[data-theme='dark'] { @include dark-theme; }
:root[data-theme='auto'] { @media (prefers-color-scheme: dark) { @include dark-theme; } }
```

**`base-theme` color tokens (light mode):**
`primary` `#6E29E7`, `primary-shade` `#b28cf2`, `primary-tint` `#f9f6fe`, `secondary` `#ff571a`, `secondary-shade` `#ffa280`, `secondary-tint` `#fff8f5`, `yellow` `#ffd400`, `text` `#1c1e26`, `text-shade` `#5d5f65`, `text-inverse` `#ffffff`, `text-inverse-shade` `#9eb4b5`, `page-background` `#f4f8fb`, `card-background` `#ffffff`, callout variants for info/warning/error/success, `code-background` `#1c1e26`, `code-text` `#ffffff`, `code-inline-background` `#e3e3e3`.

Additional raw properties: `--color--waves-start/end`, `--card-shadow`, `--card-shadow-hover`, `--image-shadow`.

**`dark-theme` overrides:**
`primary` `#9f67ff`, `primary-shade` `#4612A1`, `primary-tint` `#231934`, `secondary` `#ff723f`, `text` `#ffffff`, `page-background` `#1c1e26`, `card-background` `#32343e`, and dark callout variants. `code-background` and `code-text` are not overridden — their light values already work for dark.

### _reset.scss

Josh Comeau's CSS reset. Key rules: `box-sizing: border-box`, `margin: 0`, font smoothing, `isolation: isolate` on `#root`/`#__next`.

### _base.scss

`.container` class (applies `padded-container` mixin). List styles: `ul/ol` margin + padding, `li` margin, `li::marker` colored `var(--color--primary)`.

### _typography.scss

`a` inherits color, primary underline animates on hover. `h1`: `2.5rem / 700` (→`2rem` on phone). `h2`: `1.8rem / 600`. `h3`: `1.5rem / 600`. All `h1-h5`: Merriweather font.

### _markdown.scss

All rules scoped under `#article-content`. Key rules: paragraph margin, heading margins, centered images with shadow, blockquote with left primary border, inline code background.

### _code-highlights.scss

Prism.js syntax theme (Material Palenight). **All token colors are hardcoded — do not respond to light/dark theming.** The `pre[class*="language-"]` styling block is commented out — those are handled by `CodeBlock.svelte` instead.

### _animations.scss

Defines two `@keyframes` only:
- `svg-text-stroke`: SVG text stroke draw-on effect. Uses `var(--text-color)` (inconsistent with rest of codebase which uses `var(--color--text)`).
- `spin`: `from: rotate(0turn)` → `to: rotate(1turn)`.

## Architecture Notes

- **Theming is entirely CSS-driven** — switching the `data-theme` attribute on `<html>` is all that's needed.
- **RGB tuple pattern** — `define-color` generates `--color--{name}-rgb` as `R, G, B` for use in `rgba(var(--color--primary-rgb), 0.3)`. Canonical way to create semi-transparent theme colors.
- **`--color--` prefix convention** — all semantic color variables use this. Exception: `var(--text-color)` in `svg-text-stroke` (legacy inconsistency).
- **Breakpoint mixins are content-agnostic** — always use the named mixin (e.g. `@include for-phone-only`) rather than writing media queries by hand.
