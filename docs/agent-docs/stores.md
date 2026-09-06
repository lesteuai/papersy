# Stores

Svelte writable stores with persistent or DOM-coupled side effects.

## auth.ts

Export: `loggedIn` — a Svelte writable store of type `boolean`. Import via `$lib/stores/auth`.

- Initial value: `false` — user starts logged out.
- No side effects. Calling `loggedIn.set(value)` only updates the store.
- `+page.svelte` syncs from server data on mount: `onMount(() => { if (data.loggedIn) loggedIn.set(true); })`
- Consumers: `+page.svelte` (reads to show/hide Login vs. File Manager UI), `Header.svelte` (reads to show/hide Logout button)

## theme.ts

Export: `theme` — a custom Svelte writable store of type `string`. Import via `$lib/stores/theme`.

- Valid values: `'auto'` | `'light'` | `'dark'`
- Initial value: reads `localStorage.getItem('theme-preference')`, defaults to `'auto'`. During SSR: `undefined`.
- Every `theme.set(value)` triggers two side effects before the store updates:
  1. `localStorage.setItem('theme-preference', value)`
  2. `document.firstElementChild.setAttribute('data-theme', value)`
- `src/app.html` has an inline `<script>` that reads localStorage and sets `data-theme` before first paint (prevents flash of wrong theme).
- `ThemeToggle.svelte` calls `theme.set(nextValue)` to cycle `auto → light → dark → auto`.
