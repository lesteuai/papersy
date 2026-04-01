# src/lib/stores

Svelte writable stores with persistent or DOM-coupled side effects.

---

## Maintenance

**Keep this file up to date.** Whenever you add a new store or change the behavior of an existing one (valid values, side effects, consumers), update this file. If the change affects the shared library overview, update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## auth.ts

Export: `loggedIn` — a Svelte writable store of type `boolean`.

Import via `$lib/stores/auth`.

### Valid values
`true` | `false`

### Initial value
`false` — user starts logged out.

### Side effects
None. The store is simple and stateless — calling `loggedIn.set(value)` only updates the store, no DOM/storage writes.

### Consumers
- `src/routes/+page.svelte` — reads to show/hide Login vs. File Manager UI
- `src/lib/components/organisms/Header.svelte` — reads to show/hide Logout button

---

## theme.ts

Export: `theme` — a custom Svelte writable store of type `string`.

Import via `$lib/stores/theme`.

### Valid values
`'auto'` | `'light'` | `'dark'`

### Initial value
On mount in the browser: reads `localStorage.getItem('theme-preference')`, defaults to `'auto'` if nothing is stored.
During SSR (`browser === false`): initial value is `undefined` — components that subscribe must handle this.

### Custom `set(value)` side effects
Every call to `theme.set(value)` (including via `$theme = value`) triggers two DOM/storage writes **before** the Svelte store updates:
1. `localStorage.setItem('theme-preference', value)` — persists the preference across page loads
2. `document.firstElementChild.setAttribute('data-theme', value)` — sets `data-theme` on `<html>`, which drives the SCSS theme selectors in `_themes.scss`

### How theming works end-to-end
1. `src/app.html` has an inline `<script>` that reads localStorage and sets `data-theme` on `<html>` before first paint (prevents flash of wrong theme).
2. `_themes.scss` applies colors via `:root[data-theme='dark']` and `:root[data-theme='auto'] + prefers-color-scheme: dark`.
3. `ThemeToggle.svelte` calls `theme.set(nextValue)` to cycle `auto → light → dark → auto`.

### Consumers
- `ThemeToggle.svelte` — reads and writes
- Any component that needs to react to the current theme value can subscribe via `$theme`
