# src/lib/icons

Inline SVG icon components. Import via `$lib/icons/{name}.svelte` or `$lib/icons/socials/{name}.svelte`.

---

## Maintenance

**Keep this file up to date.** Whenever you add, remove, or change an icon component (including exceptions to the standard pattern), update the icons list and any relevant exception notes here. If the change affects the shared library overview, update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## Standard pattern

All standard line icons follow this convention:
- **No `<script>` block** — no props accepted
- `width="100%"` and `height="100%"` — size is fully controlled by the parent's CSS (set `width`/`height` on the wrapper)
- `viewBox="0 0 24 24"`
- `stroke="currentColor"` on paths — color inherits from the parent's CSS `color` property
- `fill="none"` on the SVG root
- `stroke-width="1.5"` on the SVG root

---

## Icons list

| File | Description |
|---|---|
| `alert.svelte` | Circle with vertical line + dot — warning/alert |
| `blog.svelte` | Pen writing on a line |
| `chat.svelte` | Chat bubble with three dots |
| `check.svelte` | Checkmark inside a circle |
| `circle.svelte` | Simple circle outline |
| `download.svelte` | Arrow pointing down toward a line |
| `experience.svelte` | Briefcase / work icon |
| `external-link.svelte` | Arrow exiting a box (external link indicator) |
| `features.svelte` | Three small rectangles connected by lines |
| `info.svelte` | Circle with info "i" (line + dot) |
| `internet.svelte` | Globe with wave lines |
| `pin.svelte` | Map location marker with center dot |
| `rss.svelte` | RSS feed arcs with a dot |
| `star.svelte` | Five-pointed star outline |

### Exceptions to the standard pattern

**`footer-wave.svelte`**
- `viewBox="0 0 1440 120"` — wide aspect ratio for a decorative wave
- `height="120"` (fixed px, not `100%`)
- `style="transform: scale(-1,-1)"` — flipped both axes
- `preserveAspectRatio="xMidYMid slice"`
- `class="footer__wave"`
- Fill: `var(--body-background-color)` — uses a CSS custom property, **not** `currentColor`
- No `stroke-width` or `fill="none"` — it's a filled shape, not a line icon

**`error.svelte`**
- `viewBox="0 0 1080 1080"` — large illustration
- Fully hardcoded colors via inline `<style>` block (blues, salmon, navy, pink)
- Uses `<clipPath>` elements and `mix-blend-mode` effects
- Does **not** inherit color from the parent — all colors are baked in
- Used only on the error page as an illustration

---

## Socials icons (`socials/`)

| File | Description |
|---|---|
| `email.svelte` | Envelope with chevron fold line |
| `github.svelte` | GitHub octocat-style cat icon |
| `linkedin.svelte` | LinkedIn "in" logo |
| `telegram.svelte` | Telegram paper-plane |
| `mastodon.svelte` | Mastodon logo |

All social icons follow the standard pattern (`stroke="currentColor"`, `fill="none"`, `stroke-width="1.5"`) with one exception:

**`mastodon.svelte`**
- `viewBox="0 0 192 192"` — non-standard
- Single `<path>` with `fill-rule="evenodd"` and a large `transform="translate(-1908 -212)"` offset
- **No explicit `fill` or `stroke` on the path** — may render as black rather than inheriting `currentColor` depending on browser behavior. Treat as unreliable for theming.
