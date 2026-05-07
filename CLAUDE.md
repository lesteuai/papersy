## Project Configuration

- **Language**: TypeScript
- **Framework**: SvelteKit 5 + Vite
- **Package Manager**: npm
- **Build**: `adapter-node` (SPA mode: `ssr = false` in +layout.ts)
- **Styling**: SCSS with CSS custom properties, dark/light theming
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, better-auth, mdsvex, mcp, langchain, pdf-parse, zod, pg, drizzle-orm, pgvector

---

## Environment Variables

Server-side configuration (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `ORIGIN` — Production server origin for CORS and auth redirects
- `ORIGIN_DEV` — Development server origin (used when `NODE_ENV` is not `production`; falls back to `ORIGIN`)
- `BETTER_AUTH_SECRET` — Secret key for better-auth session signing
- `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` — PostgreSQL connection details
- `CHAT_MODEL_URL` — OpenAI-compatible LLM endpoint (e.g., local Ollama at `http://localhost:11434/v1`)
- `EMBEDDING_URL` — OpenAI-compatible embedding endpoint
- `EMBEDDING_URL_KEY` — API key for the embedding endpoint (use `local` for local models)
- `BODY_SIZE_LIMIT` — SvelteKit request body size limit (e.g., `100M` for large PDF uploads)

---

## High-Level Architecture

**Papersy** is a full-stack application for research paper summarization and retrieval-augmented generation (RAG) chat. Built with SvelteKit's adapter-node in SPA mode (`ssr = false`) — pages render client-side, authentication is handled via better-auth with PostgreSQL session storage, and a REST API exposes document management and chat functionality.

### Key Directories

- **`src/routes/`** — File-based routing
  - `+layout.ts`, `+layout.svelte` — app shell with SPA mode enabled
  - `+page.server.ts`, `+page.svelte` — authenticated home page
  - `api/auth/[...all]/+server.ts` — better-auth handler
  - `api/upload/+server.ts` — PDF upload, summarize, vectorize
  - `api/chat/+server.ts` — RAG-based chat
  - `api/papers/[id]/+server.ts` — paper GET (details) and DELETE
- **`src/lib/`** — Shared library code
  - `components/` — Atomic Design system (~40 components)
  - `icons/` — SVG icon library
  - `scss/` — Global styles, theming
  - `stores/` — Svelte stores (auth, theme)
  - `utils/` — Shared types and utilities
  - `data/` — Static site data
  - `server/` — Server-only (database, LLM, auth)
- **`src/hooks.server.ts`** — SvelteKit server hook for auth

### Key Concepts

**Authentication**: better-auth with email/password flows
- Sessions stored in PostgreSQL
- Client uses `getAuthClient()` from `$lib/auth-client.ts` (lazy browser-only initialization via `$app/environment`)
- Server checks session via `auth.api.getSession({ headers })` in API routes

**Database**: PostgreSQL with Drizzle ORM
- Schema: `user`, `session`, `account`, `verification` (auth tables, auto-generated)
- Schema: `paper`, `reference` (content), `documents` (pgvector table, managed by PGVectorStore)
- Schema: `job` (upload job tracking; statuses: pending/processing/storing/done/failed/cancelled)

**LLM & RAG**: LangChain orchestration
- `ChatOpenAI` with `temperature: 0.7` for conversational chat responses
- `OpenAIEmbeddings` for vector generation
- `PGVectorStore` (`tableName: "documents"`) for similarity search
- RAG agent receives full conversation history for coherent multi-turn chat
- AI chat responses rendered as markdown HTML via `marked` library

**Upload Processing**: Background job with cancellation support
- `src/lib/server/upload-jobs.ts` holds a module-level `Map<jobId, AbortController>`
- `processUpload()` checks `signal.aborted` at each major step (PDF extraction, summarization, vectorization)
- Paper deletion aborts any active upload job for that paper
- PDF text is cleaned of page markers (`-- N of M --`) before being sent to the LLM
- LLM extracts paper name from the first page; if found, it overwrites the filename stored at upload time
- Job progresses through statuses: `pending` → `processing` → `storing` → `done`; `storing` covers the vectorization step
- `parser.destroy()` and `vectorStore.end()` are called in `finally` blocks to ensure cleanup even on error
- On job failure, error message is stored in `job.error` and preserved in `PapersyFile.uploadError` so the UI can display the reason

**Data Loading**: Lazy and incremental
- Initial page load fetches only basic paper info (`id`, `name`, `jobStatus`) -- no summary fields
- Full `summaryData` fetched on-demand via `GET /api/papers/[id]` when user clicks a paper
- Upload no longer auto-selects the new paper; current selection is preserved
- Failed papers display error reason in Summary tab; Chat tab is locked until paper is deleted and re-uploaded

**Styling & Theming**: CSS-driven via `data-theme` attribute on `<html>`

---

## Svelte MCP Server

You are able to use the Svelte MCP server with four tools:

1. **list-sections** — discover available documentation (use FIRST)
2. **get-documentation** — fetch full content for specific sections
3. **svelte-autofixer** — analyze Svelte code before sending (MANDATORY)
4. **playground-link** — generate Svelte Playground links (post-completion, user-confirmed only)

---

## src/lib

Shared, reusable library code exported globally via the `$lib` import alias. Organized by domain: components, icons, styles, stores, types, data, and server utilities.

| Directory | Purpose |
|---|---|
| `components/` | Component system (Atomic Design: atoms → molecules → organisms → dedicated) |
| `icons/` | Inline SVG icon library (~20 icons, mostly line style) |
| `scss/` | Global SCSS: reset, variables, theming, breakpoints, typography, markdown, code highlighting, animations |
| `stores/` | Svelte stores (`loggedIn` for auth, `theme` with persistence) |
| `utils/` | Shared TypeScript types and utility constants |
| `data/` | Static site data (currently: `meta.ts` for SEO defaults) |
| `server/` | Server-only: database (Drizzle), auth (better-auth), LLM (LangChain) |
| `index.ts` | Re-exports all public library symbols for convenience |
| `auth-client.ts` | Shared better-auth client for frontend API calls |

### Key Architectural Patterns

**Component Composition**
- **Atomic Design** — atoms → molecules → organisms → dedicated
- **No upward dependencies** — lower layers never import higher layers
- **Polymorphic components** — Button and Card render as `<a>` or `<button>`/`<article>` based on props

**Styling**
- **CSS-driven theming** — `data-theme` attribute on `<html>`, no JS class manipulation
- **Semantic color tokens** — `--color--{name}` generated by SCSS mixin
- **Responsive mixins** — `@include for-phone-only`, `@include for-tablet-portrait-up`, etc.
- **Scoped SCSS** — no Tailwind in components

**State Management**
- **Minimal stores** — `theme` (persistence + DOM), `loggedIn` (auth sync)
- **Local state preferred** — Svelte runes for component-local state
- **Server data flow** — papers and session loaded server-side via `+page.server.ts`, passed as `data` prop
- **`loggedIn` is a cache** — synced from `data.loggedIn` on `onMount` in `+page.svelte`

**Authentication**
- **better-auth** — email/password auth with PostgreSQL session storage
- **Shared client** — `auth-client.ts` exports `getAuthClient()` function (lazy browser-only initialization using `browser` from `$app/environment`, follows SvelteKit best practices)
- **Server validation** — every API route checks `auth.api.getSession({ headers })` directly

**Database**
- **Drizzle ORM** — lightweight, type-safe ORM
- **PostgreSQL** — pgvector-enabled for vector similarity search
- **Tables** — auth (user, session, account, verification), content (paper, reference), vectors (documents)
- **Schema files** — `schema.ts` (custom app tables), `auth.schema.ts` (generated by `npm run auth:schema`)

**LLM & RAG**
- **LangChain** — orchestration: ChatOpenAI, OpenAIEmbeddings, PGVectorStore, createAgent, tool
- **OpenAI-compatible APIs** — pluggable endpoints (local or remote, via `CHAT_MODEL_URL` / `EMBEDDING_URL`)
- **Vector store** — `tableName: "documents"`, metadata stores `{ paperId, source }`
- **Zod schemas** — structured output extraction from LLM responses

**Types**
- **Centralized in `utils/types.ts`** — all shared types including utility types, blog/feature types, and app-specific types (`PapersyFile`, `SummaryData`, `ChatMessage`, `Mode`)
- **Re-exports in `index.ts`** — available via `$lib`

### Common Import Patterns

```ts
// Components
import Button from '$lib/components/atoms/Button.svelte'
import LoginCard from '$lib/components/dedicated/app/LoginCard.svelte'

// Icons
import ChatIcon from '$lib/icons/chat.svelte'

// Stores
import { loggedIn } from '$lib/stores/auth'
import { theme } from '$lib/stores/theme'

// App types
import type { PapersyFile, SummaryData, ChatMessage, Mode } from '$lib/utils/types'

// Auth client (browser-side)
import { getAuthClient } from '$lib/auth-client'

// Server utilities (server-only: +server.ts, +page.server.ts, hooks.server.ts)
import { db } from '$lib/server/db'
import { paper, reference } from '$lib/server/db/schema'
import { getLlm, getVectorStore, createRagAgent, SummarySchema } from '$lib/server/llm'
import { auth } from '$lib/server/auth'
```

---

## Components

Components organized by Atomic Design: `atoms/` → `molecules/` → `organisms/`. Higher layers compose lower layers; lower layers have no upward dependencies.

A fourth tier, `dedicated/`, holds page-specific components that are too specialized for the generic atomic layers but still live in `$lib` for co-location.

Import via `$lib/components/{layer}/ComponentName.svelte` or `$lib/components/dedicated/{page}/ComponentName.svelte`.

### Quick Reference

| Component | Layer | Props | Named Slots | Notes |
|---|---|---|---|---|
| Header | organism | — (imports stores) | — | Logout calls `getAuthClient()!.signOut()` |
| Button | atom | color, style, size, href, additionalClass, target, rel | `icon` | |
| Card | atom | additionalClass, href, target, rel | `image`, `content`, `footer` | |
| Image | atom | src, alt, fullBleed, formats, widths | — | |
| Logo | atom | animated | — | |
| LoginCard | dedicated/app | `onLogin: (email, password) => Promise<string \| null>` | — | async; shows error + loading state |
| FilePanel | dedicated/app | files, selectedFileId, uploading?, onUpload, onSelect, onDelete | — | uploading disables button |
| FileListItem | dedicated/app | file, selected, onSelect, onDelete | — | Shows spinner when `file.jobStatus` is pending/processing; warning icon when failed/cancelled |
| SummaryView | dedicated/app | `data: SummaryData \| null`, `paperName?`, `jobStatus?`, `error?` | — | |
| ChatMessage | dedicated/app | `message: ChatMessage` | — | Renders animated dots when `message.loading` is true |
| ChatView | dedicated/app | `messages: ChatMessage[]` | — | |
| ChatInput | dedicated/app | onSend, disabled? | — | |
| ContentPanel | dedicated/app | mode, messages, summaryData, onBack, onModeChange, onSend, disabled?, jobStatus?, uploadError? | — | |

### Atoms

**Button** — Polymorphic: renders as `<a>` when `href` is provided, `<button>` otherwise.

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

**Card** — Generic container. Renders as `<a>` when `href` provided, `<article>` otherwise.

| Prop | Type | Default |
|---|---|---|
| `additionalClass` | `string \| undefined` | `undefined` |
| `href` | `string \| undefined` | `undefined` |
| `target` | `'_self' \| '_blank'` | auto |
| `rel` | `string \| undefined` | auto |

Slots: `image`, `content`, `footer`. Hover: `scale(1.01)` + elevated shadow only when `[href]` or `[onclick]` is present.

**Image** — Responsive `<img>` with optional multi-format srcset.

| Prop | Type | Default |
|---|---|---|
| `src` | `string` | required |
| `alt` | `string` | required |
| `fullBleed` | `boolean \| undefined` | `undefined` |
| `formats` | `string[]` | `['avif', 'webp', 'png']` |
| `widths` | `string[] \| undefined` | `undefined` |

In `dev` mode, srcset is skipped. If `widths` provided: width-descriptor srcset. Otherwise: format-only srcset.

**Logo** — Inline SVG. Uses YoungSerif font via SVG text.

| Prop | Type | Default |
|---|---|---|
| `animated` | `boolean` | `true` |

When `animated: true` and `prefers-reduced-motion: no-preference`: plays `svg-text-stroke` keyframe on mount.

### Organisms

**Header** — Static top nav. Position: static.
- Renders Logo linked to `/` and conditional Logout button
- Logout only shows when `$loggedIn = true`
- Logout calls `getAuthClient()!.signOut()` then `loggedIn.set(false)`
- No props — reads from stores directly

### Dedicated App Components

Page-specific components for the Papersy app. Import via `$lib/components/dedicated/app/ComponentName.svelte`.

Types are defined in `$lib/utils/types.ts`: `SummaryData`, `PapersyFile`, `ChatMessage`, `Mode`

**LoginCard** — Centered login/sign-up card with mode toggle.

| Prop | Type |
|---|---|
| `onLogin` | `(email: string, password: string) => Promise<string \| null>` |
| `onSignUp` | `(name: string, email: string, password: string) => Promise<string \| null>` |

- Returns `null` on success, an error message string on failure
- Shows loading state (e.g., "Logging in..." or "Signing up...") and disables button while loading
- Toggle between Sign In and Sign Up modes; both modes reset form and error when switching

**FilePanel** — Left sidebar for file management.

| Prop | Type | Description |
|---|---|---|
| `files` | `PapersyFile[]` | Papers to display |
| `selectedFileId` | `string \| null` | Currently selected ID |
| `uploading?` | `boolean` | Upload in progress; button shows "Processing..." and is disabled |
| `onUpload` | `(file: File) => void` | Called when user selects a PDF |
| `onSelect` | `(id: string) => void` | Called when user clicks a file |
| `onDelete` | `(id: string) => void` | Called when user deletes a file |

**FileListItem** — Single file row with delete dropdown.

| Prop | Type |
|---|---|
| `file` | `PapersyFile` |
| `selected` | `boolean` |
| `onSelect` | `(id: string) => void` |
| `onDelete` | `(id: string) => void` |

Renders filename as button, `[...]` dropdown menu with Delete option. Menu closes on click-outside. Shows a CSS spinner when `file.jobStatus === 'pending' | 'processing'`; amber warning icon when `file.jobStatus === 'failed' | 'cancelled'`.

**SummaryView** — Scrollable summary with 5 sections: Summary, Key Findings, Methodology, Limitations, References.

| Prop | Type |
|---|---|
| `data` | `SummaryData \| null` |
| `paperName?` | `string` |
| `jobStatus?` | `string` |
| `error?` | `string` |

- When `data` is present: renders the full 5-section summary.
- When `data` is null and `jobStatus` is one of pending/processing/storing/failed/cancelled: shows a "Status" section (using `.summary-section` style) with a human-readable description via `getStatusText()` helper. If `error` is also set (i.e. `jobStatus === 'failed'`), shows an "Error" section below it in the same style.
- When `data` is null and no `jobStatus`: shows a placeholder message.
- `flex: 1`, `overflow-y: auto`.

**ChatMessage** — Single message bubble. AI messages render markdown-formatted HTML; user messages are plain text.

| Prop | Type |
|---|---|
| `message` | `ChatMessage` |

User: right-aligned, primary background, plain text. AI: left-aligned, card background, markdown as formatted HTML. When `message.loading` is true — renders three animated bouncing dots. AI messages parsed with `marked.parse()` and rendered with `{@html}`, styled with `:global()` rules.

**ChatView** — Scrollable message list. Auto-scrolls to bottom on new messages via `$effect`.

**ChatInput** — Textarea + send button. Enter submits, Shift+Enter newline. When `disabled` — textarea and send button are disabled with reduced opacity.

**ContentPanel** — Full right-side panel: mode toggle + content view + chat input.

| Prop | Type |
|---|---|
| `mode` | `'summary' \| 'chat'` |
| `messages` | `ChatMessage[]` |
| `summaryData` | `SummaryData \| null` |
| `paperName?` | `string` |
| `onBack` | `() => void` |
| `onModeChange` | `(mode: 'summary' \| 'chat') => void` |
| `onSend` | `(text: string) => void` |
| `disabled?` | `boolean` |
| `uploadError?` | `string` |

- `disabled` — disables Chat tab and ChatInput (e.g., while paper is being processed); Summary tab is always accessible
- `jobStatus` — passed to SummaryView so it can display the current job state when no summary data is available
- `uploadError` — passed to SummaryView as `error` prop; also disables Chat tab and ChatInput when set

---

## Icons

Inline SVG icon components. Import via `$lib/icons/{name}.svelte` or `$lib/icons/socials/{name}.svelte`.

### Standard pattern

All standard line icons follow this convention:
- **No `<script>` block** — no props accepted
- `width="100%"` and `height="100%"` — size is fully controlled by the parent's CSS
- `viewBox="0 0 24 24"`
- `stroke="currentColor"` on paths — color inherits from the parent's CSS `color` property
- `fill="none"` on the SVG root
- `stroke-width="1.5"` on the SVG root

### Icons list

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
| `warning.svelte` | Triangle with exclamation mark -- warning/error state |

**Exceptions:**

`footer-wave.svelte` — `viewBox="0 0 1440 120"`, fixed `height="120"`, flipped both axes, fill uses `var(--body-background-color)` not `currentColor`. Decorative wave shape.

`error.svelte` — `viewBox="0 0 1080 1080"`, fully hardcoded colors via inline `<style>` block, uses `<clipPath>` and `mix-blend-mode`. Used only on the error page as an illustration.

### Socials icons (`socials/`)

| File | Description |
|---|---|
| `email.svelte` | Envelope with chevron fold line |
| `github.svelte` | GitHub octocat-style cat icon |
| `linkedin.svelte` | LinkedIn "in" logo |
| `telegram.svelte` | Telegram paper-plane |
| `mastodon.svelte` | Mastodon logo |

`mastodon.svelte` exception: `viewBox="0 0 192 192"`, single path with `fill-rule="evenodd"` and large `transform` offset. No explicit `fill` or `stroke` — may render as black rather than inheriting `currentColor`. Treat as unreliable for theming.

---

## SCSS

Global SCSS styles. Entry point is `global.scss`, imported once in `src/routes/+layout.svelte`.

### Import order (global.scss)

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

### Partials — declarative only (no CSS rules emitted)

**`_variables.scss`** — CSS custom properties on `:root`:

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

**`_functions.scss`** — SCSS function `brightness($color)`: returns a 0–1 perceived brightness value using the W3C formula `((R×0.299) + (G×0.587) + (B×0.114)) / 255`. Used only by `define-color` in `_mixins.scss`.

**`_breakpoints.scss`** — SCSS breakpoint variables and responsive mixins.

Variables:

| Variable | Value |
|---|---|
| `$breakpoint-iphone-se-max` | `320px` |
| `$breakpoint-phone-max` | `767px` |
| `$breakpoint-tablet-portrait-min` | `768px` |
| `$breakpoint-tablet-portrait-max` | `900px` |
| `$breakpoint-tablet-landscape-min` | `901px` |
| `$breakpoint-tablet-landscape-max` | `1200px` |
| `$breakpoint-desktop-min` | `1201px` |

Mixins:

| Mixin | Media query |
|---|---|
| `for-iphone-se` | `max-width: 320px` |
| `for-phone-only` | `max-width: 767px` |
| `for-tablet-portrait-up` | `min-width: 768px` |
| `for-tablet-portrait-down` | `max-width: 900px` |
| `for-tablet-landscape-up` | `min-width: 901px` |
| `for-tablet-landscape-down` | `max-width: 1200px` |
| `for-desktop-up` | `min-width: 1201px` |

**`_mixins.scss`** — Two mixins. Imports `_breakpoints.scss` and `_functions.scss`.

`padded-container` (no params) — responsive centered container:
- Base: `width: 100%; padding: 0 15px; margin: auto`
- <=320px: no padding
- >=768px: padding `0 20px`
- >=901px: padding `0 30px`
- >=1201px: `max-width: 1080px`

Applied via `.container` class (defined in `_base.scss`).

`define-color($title, $color)` — generates a full suite of CSS custom properties for a color:

| Generated property | Content |
|---|---|
| `--color--{title}` | Raw hex/color value |
| `--color--{title}-h` | HSL hue |
| `--color--{title}-s` | HSL saturation |
| `--color--{title}-l` | HSL lightness |
| `--color--{title}-a` | Alpha channel |
| `--color--{title}-rgb` | `R, G, B` comma-separated (for use in `rgba(var(--color--{title}-rgb), 0.3)`) |
| `--color--{title}-contrast` | `var(--color--text)` if brightness > 186, else `var(--color--text-inverse)` |

### Partials — emit CSS rules

**`_themes.scss`** — Core theming. Defines `base-theme` and `dark-theme` SCSS mixins, then applies them.

Application selectors:
```scss
:root { @include base-theme; }
:root[data-theme='dark'] { @include dark-theme; }
:root[data-theme='auto'] { @media (prefers-color-scheme: dark) { @include dark-theme; } }
```

`base-theme` color tokens (light mode): `primary` `#6E29E7`, `primary-shade` `#b28cf2`, `primary-tint` `#f9f6fe`, `secondary` `#ff571a`, `secondary-shade` `#ffa280`, `secondary-tint` `#fff8f5`, `yellow` `#ffd400`, `text` `#1c1e26`, `text-shade` `#5d5f65`, `text-inverse` `#ffffff`, `text-inverse-shade` `#9eb4b5`, `page-background` `#f4f8fb`, `card-background` `#ffffff`, callout variants for info/warning/error/success, `code-background` `#1c1e26`, `code-text` `#ffffff`, `code-inline-background` `#e3e3e3`.

Additional raw properties: `--color--waves-start/end`, `--card-shadow`, `--card-shadow-hover`, `--image-shadow`.

`dark-theme` overrides: `primary` `#9f67ff`, `primary-shade` `#4612A1`, `primary-tint` `#231934`, `secondary` `#ff723f`, `text` `#ffffff`, `page-background` `#1c1e26`, `card-background` `#32343e`, and dark callout variants. `code-background` and `code-text` are not overridden — their light values already work for dark.

**`_reset.scss`** — Josh Comeau's CSS reset. Key rules: `box-sizing: border-box`, `margin: 0`, font smoothing, `isolation: isolate` on `#root`/`#__next`.

**`_base.scss`** — `.container` class (applies `padded-container` mixin). List styles: `ul/ol` margin + padding, `li` margin, `li::marker` colored `var(--color--primary)`.

**`_typography.scss`** — `a` inherits color, primary underline animates on hover. `h1`: `2.5rem / 700` (→`2rem` on phone). `h2`: `1.8rem / 600`. `h3`: `1.5rem / 600`. All `h1-h5`: Merriweather font.

**`_markdown.scss`** — All rules scoped under `#article-content`. Key rules: paragraph margin, heading margins, centered images with shadow, blockquote with left primary border, inline code background.

**`_code-highlights.scss`** — Prism.js syntax theme (Material Palenight). **All token colors are hardcoded — do not respond to light/dark theming.** The `pre[class*="language-"]` styling block is commented out — those are handled by `CodeBlock.svelte` instead.

**`_animations.scss`** — Defines two `@keyframes` only:
- `svg-text-stroke`: SVG text stroke draw-on effect. Uses `var(--text-color)` (inconsistent with rest of codebase which uses `var(--color--text)`).
- `spin`: `from: rotate(0turn)` → `to: rotate(1turn)`.

### Architecture notes

- **Theming is entirely CSS-driven** — switching the `data-theme` attribute on `<html>` is all that's needed.
- **RGB tuple pattern** — `define-color` generates `--color--{name}-rgb` as `R, G, B` for use in `rgba(var(--color--primary-rgb), 0.3)`. Canonical way to create semi-transparent theme colors.
- **`--color--` prefix convention** — all semantic color variables use this. Exception: `var(--text-color)` in `svg-text-stroke` (legacy inconsistency).
- **Breakpoint mixins are content-agnostic** — always use the named mixin (e.g. `@include for-phone-only`) rather than writing media queries by hand.

---

## Stores

Svelte writable stores with persistent or DOM-coupled side effects.

### auth.ts

Export: `loggedIn` — a Svelte writable store of type `boolean`. Import via `$lib/stores/auth`.

- Initial value: `false` — user starts logged out.
- No side effects. Calling `loggedIn.set(value)` only updates the store.
- `+page.svelte` syncs from server data on mount: `onMount(() => { if (data.loggedIn) loggedIn.set(true); })`
- Consumers: `+page.svelte` (reads to show/hide Login vs. File Manager UI), `Header.svelte` (reads to show/hide Logout button)

### theme.ts

Export: `theme` — a custom Svelte writable store of type `string`. Import via `$lib/stores/theme`.

- Valid values: `'auto'` | `'light'` | `'dark'`
- Initial value: reads `localStorage.getItem('theme-preference')`, defaults to `'auto'`. During SSR: `undefined`.
- Every `theme.set(value)` triggers two side effects before the store updates:
  1. `localStorage.setItem('theme-preference', value)`
  2. `document.firstElementChild.setAttribute('data-theme', value)`
- `src/app.html` has an inline `<script>` that reads localStorage and sets `data-theme` before first paint (prevents flash of wrong theme).
- `ThemeToggle.svelte` calls `theme.set(nextValue)` to cycle `auto → light → dark → auto`.

---

## Utils / Types

Shared TypeScript types and utility constants. Import via `$lib/utils/types`.

### types.ts

**`NoUndefinedField<T>`** — Utility mapped type. Recursively strips `undefined` and `null` from every field of `T`.

**`SparkleType`** — Shape of a single sparkle animation instance: `{ id, createdAt, color, size, style: { top, left } }`

**`TagType`** — UI tag: `{ label: string; color?: 'primary' | 'secondary' }`. Note: blog post tags are plain `string[]`, not `TagType[]`.

**`SocialLink`** — Currently an empty type (`{}`). Placeholder.

**`Feature`** — Feature card entry: `{ name, description, image, tags: TagType[] }`

**`BlogPost`** — Full processed blog post: `{ tags, keywords, hidden, slug, title, date, updated, excerpt, html?, readingTime, relatedPosts, coverImage? }`

**`SummaryData`** — LLM-extracted paper summary:
```ts
{
  summary: string
  keyFindings: string[]
  methodology: string
  limitations: string
  references: string[]
}
```

**`PapersyFile`** — Frontend representation of a paper:
```ts
{
  id: string
  name: string
  summaryData?: SummaryData
  jobId?: string
  jobStatus?: string   // 'pending' | 'processing' | 'storing' | 'failed' | 'done' | 'cancelled'
  uploadError?: string
}
```

**`ChatMessage`** — Single chat message: `{ role: 'user' | 'ai'; text: string; loading?: boolean }`

**`Mode`** — `type Mode = 'summary' | 'chat'`

### regex.ts

`HttpRegex: RegExp = /^((http|https):\/\/)/` — Matches strings that begin with `http://` or `https://`. Used by `Button.svelte` and `Card.svelte` to detect external links.

---

## Static Data (src/lib/data)

### meta.ts

Site-wide SEO/meta constants used as defaults in layout `<svelte:head>` blocks.

| Export | Value |
|---|---|
| `siteBaseUrl` | `'https://sveltekit-static-blog-template.vercel.app/'` |
| `title` | `'SvelteKit Static Blog Template'` |
| `description` | `"A light, neat, and easy-to-use SvelteKit template for your next website."` |
| `keywords` | `['Svelte', 'SvelteKit', 'Template', 'Blog', 'Starter', 'Static Site']` |
| `image` | `'https://sveltekit-static-blog-template.vercel.app//images/site-preview.png'` (note: double slash — trailing slash on `siteBaseUrl`) |

---

## Server Modules (src/lib/server)

Server-only modules: database access, authentication, and LLM operations. **Never import in browser code** (`.svelte` files, `+page.ts`, `+layout.ts`). Safe to import in `+server.ts`, `+page.server.ts`, `+layout.server.ts`, and `hooks.server.ts`.

```
src/lib/server/
├── auth.ts           <- better-auth instance
├── llm.ts            <- LangChain: embeddings, vector store, RAG agent, summary schema
├── upload-jobs.ts    <- shared AbortController map for upload job cancellation
└── db/
    ├── index.ts      <- Drizzle ORM client
    ├── schema.ts     <- custom tables (paper, reference, job) + re-exports auth.schema
    └── auth.schema.ts <- generated by `npm run auth:schema` (user, session, account, verification)
```

### auth.ts

Exports `auth` — the better-auth instance, and `requireSession` — a shared auth guard.

**Config:**
- Database: Drizzle adapter with PostgreSQL
- Origin: `ORIGIN_DEV` in development (`NODE_ENV !== 'production'`), `ORIGIN` in production
- Provider: email/password with sign-up limit (100 users max via `beforeSignUp` hook)
- Email verification: `requireEmailVerification: true` forces users to verify before login
- Forgot password: built-in password reset flow with `sendResetPassword` callback
- Email callbacks: `sendVerificationEmail` and `sendResetPassword` (currently log to console — TODO: implement Resend/SendGrid/Nodemailer)
- Plugins: `sveltekitCookies(getRequestEvent)` — handles cookie injection per request

**Usage:**
```ts
import { requireSession } from '$lib/server/auth';

const session = await requireSession(request.headers);
// session.user.id, session.user.email
// throws 401 automatically if no session
```

Sign-up limited to 100 users via `beforeSignUp` hook; returns `USER_LIMIT_REACHED` error code when exceeded.

### db/index.ts

Exports `db` — Drizzle ORM client connected to PostgreSQL via `postgres-js` driver. Connection string from `DATABASE_URL` env var.

```ts
import { db } from '$lib/server/db';
import { paper } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const rows = await db.query.paper.findMany({
  where: eq(paper.userId, userId),
  with: { references: true }
});
```

### db/schema.ts

Custom Drizzle schema. Re-exports `auth.schema.ts`.

`paper` table: `id` (PK uuid), `userId` (FK→user, cascade delete), `name` (text), `summary` (nullable), `keyFindings` (nullable, JSON stringified `string[]`), `methodology` (nullable), `limitations` (nullable), `createdAt` (defaultNow).

`reference` table: `id` (PK uuid), `paperId` (FK→paper, cascade delete), `text` (text).

`job` table: `id` (PK uuid), `userId` (FK→user, cascade delete), `status` (text, default `'pending'`; values: pending/processing/storing/done/failed/cancelled), `paperId` (nullable FK→paper, set null on delete), `error` (nullable text), `createdAt` (defaultNow).

Relations: `paperRelations` (one-to-many → reference, one-to-many → job), `referenceRelations` (many-to-one → paper), `jobRelations` (many-to-one → user, many-to-one → paper).

**Note:** The `documents` table (pgvector) is managed entirely by `PGVectorStore.initialize()` — not in Drizzle schema.

`db/auth.schema.ts` — Auto-generated. Run `npm run auth:schema` to regenerate after changing `auth.ts`. Tables: `user`, `session`, `account`, `verification`.

### llm.ts

LangChain orchestration for summarization and RAG.

**`SummarySchema`** — Zod schema for structured LLM output:
```ts
{
  name: string | null,        // paper title from first page; null if not determinable
  summary: string,            // 3-5 sentence paper summary
  key_findings: string[3],    // exactly 3 key insights
  references: string[],       // extracted references, no numeric labels
  methodology: string,        // or "No methodology section found."
  limitations: string,        // or "No limitations section found."
}
```

**`getEmbeddings()`** — `OpenAIEmbeddings` using `EMBEDDING_URL` env var.

**`getLlm()`** — `ChatOpenAI` using `CHAT_MODEL_URL` env var, `maxTokens: 6000`, model name `"local"`.

**`checkLlmHealth()`** — Pings `CHAT_MODEL_URL/models` with a 5-second timeout. Returns `true` if reachable. Call before invoking the LLM to fail fast with a 503.

**`getVectorStore()`** — `PGVectorStore` initialized with `tableName: "documents"`. **Always call `vectorStore.end()` after use** to release the connection pool.

**`createRagAgent(paperId, { name, summary })`** — Creates a RAG agent scoped to a single paper:
1. Initialize `PGVectorStore`
2. Create `retrieve` tool: runs `similaritySearch(query, 4, { paperId })`
3. Call `buildSystemPrompt(name, summary)` — interpolates `{paperName}` and `{paperSummary}` placeholders in `default-prompts/chatbot.txt`
4. Create agent with built prompt
5. Return `{ agent, vectorStore }` (caller must call `vectorStore.end()`)

### upload-jobs.ts

Exports a module-level `Map<string, AbortController>` (`activeJobs`) keyed by `jobId`. Imported by both the upload and delete handlers to support upload cancellation when a paper is deleted mid-processing.

```ts
import { activeJobs } from '$lib/server/upload-jobs';

// In upload handler: register controller
const controller = new AbortController();
activeJobs.set(jobId, controller);

// In delete handler: abort active upload
activeJobs.get(jobId)?.abort();
```

---

## Routes

SvelteKit file-based routing. Full-stack SPA application with authenticated pages and REST API routes.

```
src/routes/
├── +layout.ts                    <- export const ssr = false
├── +layout.svelte                <- Header + outlet, global styles
├── +page.server.ts               <- load(): fetch user's papers from DB
├── +page.svelte                  <- App shell: Login page or File+Content panels
├── verify-email/+page.svelte     <- Email verification page (token-based)
├── forgot-password/+page.svelte  <- Forgot password form (send reset email)
├── reset-password/+page.svelte   <- Reset password form (verify token, set new password)
│
└── api/
    ├── auth/[...all]/+server.ts  <- GET/POST catch-all for better-auth
    ├── upload/+server.ts         <- POST: submit PDF, return { jobId, paperId } (async)
    ├── jobs/[id]/+server.ts      <- GET: poll job status
    ├── chat/+server.ts           <- POST: RAG agent, passes only last message
    └── papers/[id]/+server.ts   <- GET: fetch paper; DELETE: paper + cascading cleanup

(src/hooks.server.ts at project root handles auth per-request)
```

### Root layout

`+layout.ts` — `export const ssr = false` (SPA mode; pages rendered client-side).

`+layout.svelte` — Renders `<Header />` and `<main>{@render children()}</main>`, imports `global.scss`.

### Root page (`/`)

**`+page.server.ts`** — `load()` runs on the client in SPA mode:
- If no session: `{ papers: [], loggedIn: false }`
- If session: fetches all papers with their most recent non-done job (`ne(job.status, 'done')`); returns `PapersyFile[]` with `jobId`/`jobStatus` for in-progress papers

**`+page.svelte`** — App shell with three logical states:

1. **Auth** — `!$loggedIn`: centered `<LoginCard />` with sign in/up toggle
2. **File Manager + Summary** — `$loggedIn`, file selected: `<FilePanel />` + `<ContentPanel mode="summary" />`
3. **File Manager + Chat** — `$loggedIn`, chat mode active: same layout, chat view on right

State:
```ts
let files: PapersyFile[] = $state([]);
let selectedFileId = $state(null);
let selectedFile = $derived(files.find(f => f.id === selectedFileId));
let jobsInProgress = $state({});   // Record<paperId, { jobId, status, error? }>
let isProcessing = $derived(...);  // true if selectedFile has active job
let mode = $state('summary');
let messages = $state([]);         // ChatMessage[]
let uploading = $state(false);
let mobileActivePanel = $state('files');  // 'files' | 'content'
```

Event handlers:

| Handler | What it does |
|---|---|
| `handleLogin(email, password)` | `getAuthClient()!.signIn.email(...)`, sets loggedIn |
| `handleUpload(file)` | POST `/api/upload`, adds paper with `jobStatus: 'pending'`, starts polling |
| `handleSelect(id)` | Sets selectedFileId; resets mode+messages when switching files |
| `handleDelete(id)` | DELETE `/api/papers/:id`, removes from files, stops polling |
| `handleSend(text)` | Adds user message + AI loading message, POST `/api/chat`, replaces loading with response |
| `handleBack()` | Resets mode+messages, toggles mobile panel or clears selectedFileId on desktop |

### API Routes

**POST `/api/upload`**

Request: `FormData { file: File }` (PDF only). Response (202): `{ "jobId": "uuid", "paperId": "uuid" }`.

Pipeline:
1. Auth check (401), validate PDF (400)
2. Create empty `paper` row + `job` row with `status: "pending"`, return both IDs
3. Background task: LLM health check → PDF parse + clean → structured summary via `SummarySchema` → UPDATE paper → INSERT references → update job to `"storing"` → embed + vectorize → update job to `"done"` (or `"failed"` with error)

**GET `/api/jobs/[id]`**

Response: `{ status, paperId, error }`. Auth check + ownership verify.

**POST `/api/chat`**

Request: `{ paperId, messages: ChatMessage[] }`. Response: `{ text: "AI response" }`.

Pipeline: auth check → validate paperId → fetch paper (ownership) → LLM health check → `createRagAgent(paperId, { name, summary })` → invoke with full history → `vectorStore.end()` → return last message text.

**GET `/api/papers/[id]`**

Response: `{ id, name, summaryData: SummaryData }`. Auth check + ownership verify + relational query with references.

**DELETE `/api/papers/[id]`**

Response: 204 No Content. Pipeline: auth → validate → ownership check → `vectorStore.delete({ filter: { paperId } })` → `db.delete(paper)` (cascades to references) → `vectorStore.end()`.

**GET+POST `/api/auth/[...all]`**

Catch-all delegating to better-auth's `svelteKitHandler`. Passes `building` flag to skip auth during build time.

### Server Hook

`src/hooks.server.ts` — Delegates to `svelteKitHandler({ auth, event, resolve, building })`. Validates auth cookies and injects session context on every request.

### Responsive Layout

Desktop/Landscape: Two-column flex (`28%` files, `72%` content).
Portrait Mobile: Single-column toggle — show only the active panel.
