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
| Header | organism | showBackground | — | Logo |
| Button | atom | color, style, size, href, additionalClass, target, rel | `icon` | — |
| Card | atom | additionalClass, href, target, rel | `image`, `content`, `footer` | — |
| Image | atom | src, alt, fullBleed, formats, widths | — | — |
| Logo | atom | animated | — | — |
| LoginCard | dedicated/app | onLogin: () => void | — | Button |
| FilePanel | dedicated/app | files: PapersyFile[], selectedFileId: string \| null, onUpload, onSelect, onDelete | — | FileListItem |
| FileListItem | dedicated/app | file: PapersyFile, selected: boolean, onSelect, onDelete | — | — |
| SummaryView | dedicated/app | data: SummaryData \| null | — | — |
| ChatMessage | dedicated/app | message: ChatMessage | — | — |
| ChatView | dedicated/app | messages: ChatMessage[] | — | ChatMessage |
| ChatInput | dedicated/app | onSend, oninput? | — | — |
| ContentPanel | dedicated/app | mode, messages, summaryData, onBack, onModeChange, onSend | — | ChatView, SummaryView, ChatInput |

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

## Organisms

### Header
Static top nav (not floating or sticky). Position: static.

| Prop | Type | Default |
|---|---|---|
| (none — uses imports) | — | — |

Renders Logo linked to `/` and conditional Logout button. Logout button only shows when `$loggedIn = true`. Uses `$lib/stores/auth`.

---

## Dedicated App Components

Page-specific components for the Papersy app. Located in `dedicated/app/`. Import via `$lib/components/dedicated/app/ComponentName.svelte`.

### LoginCard
Centered login form card.

| Prop | Type |
|---|---|
| `onLogin` | `() => void` |

Renders a card with username and password inputs, plus a submit button. Calls `onLogin()` on form submit.

---

### FilePanel
Left sidebar for file management.

| Prop | Type |
|---|---|
| `files` | `PapersyFile[]` |
| `selectedFileId` | `string \| null` |
| `onUpload` | `(file: File) => void` |
| `onSelect` | `(id: string) => void` |
| `onDelete` | `(id: string) => void` |

Renders Upload button (hidden `<input type="file" accept=".pdf">`), file list (renders `FileListItem` for each), and empty state hint when no files.

---

### FileListItem
Single file row with delete menu.

| Prop | Type |
|---|---|
| `file` | `PapersyFile` |
| `selected` | `boolean` |
| `onSelect` | `(id: string) => void` |
| `onDelete` | `(id: string) => void` |

Renders filename as button (clickable to select), and a `[...]` dropdown menu with Delete option. Menu closes on click-outside.

---

### SummaryView
Scrollable summary content with multiple sections.

| Prop | Type |
|---|---|
| `data` | `SummaryData \| null` |

Renders 5 sections: Summary, Key Findings, Methodology, Limitations, References. Each section is a collapsible/expandable card. Fully scrollable with `overflow-y: auto` and `flex: 1` so it fills available space and scrolls independently.

---

### ChatMessage
Single message bubble in a chat conversation.

| Prop | Type |
|---|---|
| `message` | `ChatMessage` |

User messages: right-aligned, primary-color background bubble.
AI messages: left-aligned, card-background bubble.

---

### ChatView
Scrollable message list.

| Prop | Type |
|---|---|
| `messages` | `ChatMessage[]` |

Renders a list of `ChatMessage` components. Auto-scrolls to bottom on new messages via `$effect`. Scrollable with `overflow-y: auto`.

---

### ChatInput
Text input + send button for chat.

| Prop | Type |
|---|---|
| `onSend` | `(text: string) => void` |
| `oninput?` | `() => void` |

Textarea (auto-grows to fit content) + circular send button (icon). Enter submits; Shift+Enter adds newline. Emits `onSend(text)` on submit. Optional `oninput` callback for detecting user input (e.g., auto-switch to chat mode).

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

Renders back button (arrow-left icon), Summary/Chat mode tabs, content area (either `SummaryView` or `ChatView`), and `ChatInput` pinned at bottom. `ChatInput.oninput` calls `onModeChange('chat')` to auto-switch mode when typing.
