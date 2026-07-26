# Components

Components organized by Atomic Design: `atoms/` → `molecules/` → `organisms/`. Higher layers compose lower layers; lower layers have no upward dependencies.

A fourth tier, `dedicated/`, holds page-specific components that are too specialized for the generic atomic layers but still live in `$lib` for co-location.

Import via `$lib/components/{layer}/ComponentName.svelte` or `$lib/components/dedicated/{page}/ComponentName.svelte`.

## Quick Reference

| Component | Layer | Props | Named Slots | Notes |
|---|---|---|---|---|
| Header | organism | — (imports stores) | — | Logout calls `getAuthClient()!.signOut()` |
| Button | atom | color, style, size, href, additionalClass, target, rel | `icon` | |
| Card | atom | additionalClass, href, target, rel | `image`, `content`, `footer` | |
| Image | atom | src, alt, fullBleed, formats, widths | — | |
| Logo | atom | animated | — | |
| LoginCard | dedicated/app | `onLogin`, `onSignUp` | — | async; shows error + loading state |
| ProjectList | dedicated/app | projects, selectedId?, onCreate, onSelect, onRename, onDelete | — | Owns the create form and the rename dialog |
| ProjectListItem | dedicated/app | project, selected, onSelect, onRenameRequest, onDelete | — | `[...]` dropdown menu; closes on click-outside |
| SessionList | dedicated/app | sessions, selectedId?, onCreate, onSelect, onRename, onDelete | — | Owns the rename dialog for sessions |
| RenameDialog | dedicated/app | open, currentValue, title?, onSubmit, onCancel | — | Shared by ProjectList and SessionList; validates via `validateName` |
| DocumentList | dedicated/app | projectId | — | Owns its own fetch/poll/upload state; polls every 1s while any document is ingesting |
| DocumentListItem | dedicated/app | document, onDelete | — | Spinner while in progress; alert icon when failed; check icon when done |
| ChatView | dedicated/app | messages, onSend | — | Composes `ChatInput` itself; derives disabled from `messages.some(m => m.loading)` |
| ChatMessage | dedicated/app | `message` | — | Renders animated dots when loading |
| ChatInput | dedicated/app | onSend, disabled? | — | |

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

Slots: `icon` (named, 24px wrapper), default (label text). Forwards `on:click` and `$$restProps`. Sets `data-sveltekit-preload-data`.

### Card

Generic container. Renders as `<a>` when `href` provided, `<article>` otherwise.

| Prop | Type | Default |
|---|---|---|
| `additionalClass` | `string \| undefined` | `undefined` |
| `href` | `string \| undefined` | `undefined` |
| `target` | `'_self' \| '_blank'` | auto |
| `rel` | `string \| undefined` | auto |

Slots: `image`, `content`, `footer`. Hover: `scale(1.01)` + elevated shadow only when `[href]` or `[onclick]` is present.

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

### Logo

Inline SVG. Uses YoungSerif font via SVG text.

| Prop | Type | Default |
|---|---|---|
| `animated` | `boolean` | `true` |

When `animated: true` and `prefers-reduced-motion: no-preference`: plays `svg-text-stroke` keyframe on mount.

## Organisms

### Header

Static top nav. Position: static.
- Renders Logo linked to `/` and conditional Logout button
- Logout only shows when `$loggedIn = true`
- Logout calls `getAuthClient()!.signOut()` then `loggedIn.set(false)`
- No props — reads from stores directly

## Dedicated App Components

Page-specific components for the project workspace. Import via `$lib/components/dedicated/app/ComponentName.svelte`.

Types are defined in `$lib/utils/types.ts`: `Project`, `Session`, `Document`, `ChatMessage`, `JobStatus`.

### LoginCard

Centered login/sign-up card with mode toggle.

| Prop | Type |
|---|---|
| `onLogin` | `(email: string, password: string) => Promise<string \| null>` |
| `onSignUp` | `(name: string, email: string, password: string) => Promise<string \| null>` |

- Returns `null` on success, an error message string on failure
- Shows loading state (e.g., "Logging in..." or "Signing up...") and disables button while loading
- Toggle between Sign In and Sign Up modes; both modes reset form and error when switching
- Sign-up succeeds without an email verification round trip

### ProjectList

Left-panel list on `/`: create form, item list, rename dialog.

| Prop | Type |
|---|---|
| `projects` | `Project[]` |
| `selectedId?` | `string \| null` |
| `onCreate` | `(name: string) => void` |
| `onSelect` | `(id: string) => void` |
| `onRename` | `(id: string, name: string) => void` |
| `onDelete` | `(id: string) => void` |

Validates the new-project name client-side with `validateName` before calling `onCreate`; shows the validation message inline on failure. Owns a `RenameDialog` instance, opened via `ProjectListItem`'s `onRenameRequest`.

### ProjectListItem

Single project row with a `[...]` dropdown menu (Rename, Delete).

| Prop | Type |
|---|---|
| `project` | `Project` |
| `selected` | `boolean` |
| `onSelect` | `(id: string) => void` |
| `onRenameRequest` | `(id: string) => void` |
| `onDelete` | `(id: string) => void` |

Menu closes on click-outside (`onclick` handlers call `e.stopPropagation()`).

### SessionList

Left-panel "Chats" tab inside a project: session list, new-session button, rename dialog.

| Prop | Type |
|---|---|
| `sessions` | `Session[]` |
| `selectedId?` | `string \| null` |
| `onCreate` | `() => void` |
| `onSelect` | `(id: string) => void` |
| `onRename` | `(id: string, name: string) => void` |
| `onDelete` | `(id: string) => void` |

Each row shows `session.label` (the derived display label), not `session.name` directly. Owns its own `RenameDialog` instance and per-row dropdown menu state (`openMenuId`).

### RenameDialog

Shared modal used by both `ProjectList` and `SessionList` for renaming.

| Prop | Type |
|---|---|
| `open` | `boolean` |
| `currentValue` | `string` |
| `title?` | `string` (default `'Rename'`) |
| `onSubmit` | `(name: string) => void` |
| `onCancel` | `() => void` |

On open, seeds its input from `currentValue`, clears any prior error, and focuses the input. Validates with `validateName` on submit and shows the message inline on failure rather than calling `onSubmit`.

### DocumentList

Left-panel "Docs" tab inside a project: upload control, list, and its own polling.

| Prop | Type |
|---|---|
| `projectId` | `string` |

Fetches `GET /api/projects/:id/documents` itself and re-polls every 1 second while any document is `pending`, `processing` or `storing`, so ingestion status reaches `done` without a page reload. Accepts `.pdf,.md,.markdown,.txt` on its file input. Uploads via `POST /api/projects/:id/documents` and shows the returned error message inline on rejection.

### DocumentListItem

Single document row with a status icon.

| Prop | Type |
|---|---|
| `document` | `Document` |
| `onDelete` | `(id: string) => void` |

Spinning circle icon while `pending`/`processing`/`storing`; alert icon when `failed`; check icon when `done`.

### ChatMessage

Single message bubble. Assistant messages render markdown-formatted HTML; user messages are plain text.

| Prop | Type |
|---|---|
| `message` | `ChatMessage` |

`message.role` is `'user' | 'assistant'`. User: right-aligned, primary background, plain text. Assistant: left-aligned, card background, markdown as formatted HTML. When `message.loading` is true — renders three animated bouncing dots. Assistant messages parsed with `marked.parse()`, sanitized with `DOMPurify.sanitize()`, and rendered with `{@html}`, styled with `:global()` rules.

**Sanitization.** Assistant text can quote pages found by the `webSearch` tool, so it is third-party content reaching `{@html}`. `marked.parse(message.text)` runs first, then `DOMPurify.sanitize()` on the resulting HTML string, before it reaches `{@html}`. User messages take the `{message.text}` branch instead, rendered as plain text, so they never touch `{@html}` and need no sanitizing. Sanitization happens at render, not on write, so assistant messages persisted before this change are sanitized too, every time they are read.

DOMPurify runs with its default configuration on purpose. The default allow-list already covers every tag the component's `:global()` style rules target (`h1` through `h6`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`, `strong`, `em`, `a`, `hr`), while stripping `script`, `on*` event-handler attributes and `javascript:` URLs. Narrowing `ALLOWED_TAGS` would silently flatten real replies, so it should not be tightened without checking those style rules first.

This depends on `ssr = false` (set in `src/routes/+layout.ts`). DOMPurify sets `isSupported = false` when constructed without a DOM, and its `sanitize` then returns the input unchanged rather than throwing. Because no component in this app runs server-side, the sanitizer always has a real DOM to work with. Turning SSR on for this route would silently disable sanitization instead of producing an error, which is also why the plain `dompurify` package is used here rather than `isomorphic-dompurify`.

### ChatView

Scrollable message list. Composes `ChatInput` itself (the parent page no longer renders `ChatInput` separately).

| Prop | Type |
|---|---|
| `messages` | `ChatMessage[]` |
| `onSend` | `(text: string) => void` |

Derives its in-flight disabled state as `messages.some((message) => message.loading)` and passes that to the composed `ChatInput`. Auto-scrolls to bottom on new messages via `$effect`. Shows an empty-state hint when `messages.length === 0`.

### ChatInput

Textarea + send button. Enter submits, Shift+Enter newline.

| Prop | Type |
|---|---|
| `onSend` | `(text: string) => void` |
| `disabled?` | `boolean` |

When `disabled` — textarea and send button are disabled with reduced opacity, and the send button is also disabled when the textarea is empty/whitespace-only.

## Deleted

`SummaryView`, `ContentPanel`, `FilePanel` and `FileListItem` are gone along with the paper-summarization feature they served.
