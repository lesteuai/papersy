# src/routes

SvelteKit file-based routing. Single-page application (SPA) at the root `/`. All routing is client-side via Svelte stores.

---

## Route structure

```
src/routes/
├── +layout.ts          ← export const prerender = true, ssr = false
├── +layout.svelte      ← imports global.scss, renders Header, slot
│
└── +page.svelte        ← SPA shell: Login (Page 1), File Manager + Summary/Chat (Pages 2–3)
```

---

## Root layout

**`+layout.ts`** — sets `export const prerender = true` and `export const ssr = false`.
- `prerender: true` → generates `index.html` at build time (the SPA shell)
- `ssr: false` → no server-side rendering; app runs entirely in the browser

**`+layout.svelte`** — imports `global.scss`, renders `<Header />` and `<main><slot /></main>`. No Footer.
- `<Header />` is static (not floating), conditional Logout button when logged in
- Global `<svelte:head>` meta tags (basic page title)

---

## SPA app shell (`/`)

**`+page.svelte`** — single-page app shell. Full client-side state management via Svelte stores and runes.

### Pages

1. **Page 1: Login** — When `$loggedIn = false`
   - Centered `<LoginCard />` with username/password form
   - On submit: `loggedIn.set(true)`

2. **Page 2: File Manager + Summary View** — When `$loggedIn = true`, file selected
   - Left panel: `<FilePanel />` — Upload button, file list, delete menus
   - Right panel: `<ContentPanel />` — Mode toggle (Summary/Chat), Summary view with sections (scrollable), Chat input

3. **Page 3: Chat** — Same panels, chat mode active
   - Right panel: scrollable message list + chat input

### State Management

**Stores:**
- `loggedIn` — writable boolean, persists auth state

**Local component state (runes):**
- `files` — array of `PapersyFile` (id, name)
- `selectedFileId` — currently selected file
- `mode` — 'summary' | 'chat'
- `messages` — array of `ChatMessage` (role, text)
- `mobileActivePanel` — 'files' | 'content' (portrait mobile only)

### Responsive Behavior

**Desktop/Landscape:** Two-panel layout
- Left: `flex: 0 0 28%` (220–300px)
- Right: `flex: 1` (remaining space)

**Portrait Mobile:** Single-panel full-width
- Show only the active panel (`files` or `content`)
- Back button on content panel toggles back to files list
- Selecting a file switches to content panel

### Layout CSS

```scss
.app-shell { display: flex; height: calc(100vh - 85px); }
.file-panel-wrap { flex: 0 0 28%; min-width: 220px; max-width: 300px; }
.content-panel-wrap { flex: 1; }
@media (orientation: portrait) and (max-width: 767px) {
  .file-panel-wrap, .content-panel-wrap { flex: 0 0 100%; width: 100%; }
  .hidden { display: none; }
}
```

---

## Maintenance

**Keep this file up to date.** Whenever you add a new route, modify the SPA shell layout, or change the app's state structure, update this file. If the change affects the high-level route architecture, update the root [CLAUDE.md](../../CLAUDE.md) as well.
