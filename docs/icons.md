# Icons

Inline SVG icon components. Import via `$lib/icons/{name}.svelte` or `$lib/icons/socials/{name}.svelte`.

## Standard Pattern

All standard line icons follow this convention:
- **No `<script>` block** — no props accepted
- `width="100%"` and `height="100%"` — size is fully controlled by the parent's CSS
- `viewBox="0 0 24 24"`
- `stroke="currentColor"` on paths — color inherits from the parent's CSS `color` property
- `fill="none"` on the SVG root
- `stroke-width="1.5"` on the SVG root

## Icons List

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
| `warning.svelte` | Triangle with exclamation mark — warning/error state |

## Exceptions

**`footer-wave.svelte`** — `viewBox="0 0 1440 120"`, fixed `height="120"`, flipped both axes, fill uses `var(--body-background-color)` not `currentColor`. Decorative wave shape.

**`error.svelte`** — `viewBox="0 0 1080 1080"`, fully hardcoded colors via inline `<style>` block, uses `<clipPath>` and `mix-blend-mode`. Used only on the error page as an illustration.

## Socials Icons (`socials/`)

| File | Description |
|---|---|
| `email.svelte` | Envelope with chevron fold line |
| `github.svelte` | GitHub octocat-style cat icon |
| `linkedin.svelte` | LinkedIn "in" logo |
| `telegram.svelte` | Telegram paper-plane |
| `mastodon.svelte` | Mastodon logo |

**`mastodon.svelte` exception**: `viewBox="0 0 192 192"`, single path with `fill-rule="evenodd"` and large `transform` offset. No explicit `fill` or `stroke` — may render as black rather than inheriting `currentColor`. Treat as unreliable for theming.
