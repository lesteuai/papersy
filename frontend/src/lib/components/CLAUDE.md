# src/lib/components

Components organized by Atomic Design: `atoms/` → `molecules/` → `organisms/`. Higher layers compose lower layers; lower layers have no upward dependencies.

A fourth tier, `dedicated/`, holds page-specific components that are too specialized for the generic atomic layers but still live in `$lib` for co-location.

Import via `$lib/components/{layer}/ComponentName.svelte` or `$lib/components/dedicated/{page}/ComponentName.svelte`.

---

## Maintenance

**Keep this file up to date.** Whenever you add, remove, rename, or change the props/slots/behavior of a component, update the entry here. If the change affects the library overview, update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## Quick Reference

| Component | Layer | Props | Named Slots | Notes |
|---|---|---|---|---|
| Header | organism | — (imports stores) | — | Logout calls `authClient.signOut()` |
| Button | atom | color, style, size, href, additionalClass, target, rel | `icon` | |
| Card | atom | additionalClass, href, target, rel | `image`, `content`, `footer` | |
| Image | atom | src, alt, fullBleed, formats, widths | — | |
| Logo | atom | animated | — | |
| LoginCard | dedicated/app | `onLogin: (email, password) => Promise<string \| null>` | — | async; shows error + loading state |
| FilePanel | dedicated/app | files, selectedFileId, uploading?, onUpload, onSelect, onDelete | — | uploading disables button |
| FileListItem | dedicated/app | file, selected, onSelect, onDelete | — | |
| SummaryView | dedicated/app | `data: SummaryData \| null` | — | |
| ChatMessage | dedicated/app | `message: ChatMessage` | — | |
| ChatView | dedicated/app | `messages: ChatMessage[]` | — | |
| ChatInput | dedicated/app | onSend, oninput? | — | |
| ContentPanel | dedicated/app | mode, messages, summaryData, onBack, onModeChange, onSend | — | |

---

## Atoms

### Button
Polymorphic: renders as `<a>` when `href` is provided, `<button>` otherwise.

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

Slots: `image`, `content`, `footer`.
Hover: `scale(1.01)` + elevated shadow only when `[href]` or `[onclick]` is present.

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

In `dev` mode, srcset is skipped. If `widths` provided: width-descriptor srcset. Otherwise: format-only srcset.

---

### Logo
Inline SVG. Uses YoungSerif font via SVG text.

| Prop | Type | Default |
|---|---|---|
| `animated` | `boolean` | `true` |

When `animated: true` and `prefers-reduced-motion: no-preference`: plays `svg-text-stroke` keyframe on mount.

---

## Organisms

### Header
Static top nav. Position: static.

- Renders Logo linked to `/` and conditional Logout button
- Logout only shows when `$loggedIn = true`
- Logout calls `authClient.signOut()` then `loggedIn.set(false)`
- No props — reads from stores directly

---

## Dedicated App Components

Page-specific components for the Papersy app. Import via `$lib/components/dedicated/app/ComponentName.svelte`.

Types are defined in `$lib/components/dedicated/app/types.ts`:
```ts
type SummaryData = { summary, keyFindings: string[], methodology, limitations, references: string[] }
type PapersyFile = { id: string; name: string; summaryData?: SummaryData }
type ChatMessage = { role: 'user' | 'ai'; text: string }
type Mode = 'summary' | 'chat'
```

---

### LoginCard
Centered login card with email/password form.

| Prop | Type |
|---|---|
| `onLogin` | `(email: string, password: string) => Promise<string \| null>` |

- Returns `null` on success, an error message string on failure
- Component shows the error message if returned
- Shows "Logging in..." and disables button while `loading = true`
- **Updated from previous:** `onLogin` is now async with email parameter (was sync username)

---

### FilePanel
Left sidebar for file management.

| Prop | Type | Description |
|---|---|---|
| `files` | `PapersyFile[]` | Papers to display |
| `selectedFileId` | `string \| null` | Currently selected ID |
| `uploading?` | `boolean` | **NEW:** Upload in progress; button shows "Processing..." and is disabled |
| `onUpload` | `(file: File) => void` | Called when user selects a PDF |
| `onSelect` | `(id: string) => void` | Called when user clicks a file |
| `onDelete` | `(id: string) => void` | Called when user deletes a file |

---

### FileListItem
Single file row with delete dropdown.

| Prop | Type |
|---|---|
| `file` | `PapersyFile` |
| `selected` | `boolean` |
| `onSelect` | `(id: string) => void` |
| `onDelete` | `(id: string) => void` |

Renders filename as button, `[...]` dropdown menu with Delete option. Menu closes on click-outside.

---

### SummaryView
Scrollable summary with 5 sections: Summary, Key Findings, Methodology, Limitations, References.

| Prop | Type |
|---|---|
| `data` | `SummaryData \| null` |

Shows placeholder when `data` is null. `flex: 1`, `overflow-y: auto`.

---

### ChatMessage
Single message bubble.

| Prop | Type |
|---|---|
| `message` | `ChatMessage` |

User: right-aligned, primary background. AI: left-aligned, card background.

---

### ChatView
Scrollable message list.

| Prop | Type |
|---|---|
| `messages` | `ChatMessage[]` |

Auto-scrolls to bottom on new messages via `$effect`.

---

### ChatInput
Textarea + send button.

| Prop | Type |
|---|---|
| `onSend` | `(text: string) => void` |
| `oninput?` | `() => void` |

Auto-growing textarea. Enter submits, Shift+Enter newline. Optional `oninput` for external side effects (e.g., auto-switch to chat mode).

---

### ContentPanel
Full right-side panel: mode toggle + content view + chat input.

| Prop | Type |
|---|---|
| `mode` | `'summary' \| 'chat'` |
| `messages` | `ChatMessage[]` |
| `summaryData` | `SummaryData \| null` |
| `onBack` | `() => void` |
| `onModeChange` | `(mode: 'summary' \| 'chat') => void` |
| `onSend` | `(text: string) => void` |

Back button (mobile), Summary/Chat tabs, content area (SummaryView or ChatView), ChatInput pinned at bottom.
`ChatInput.oninput` calls `onModeChange('chat')` to auto-switch when user starts typing.
