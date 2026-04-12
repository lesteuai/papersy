# Plan: Shared AuthCard Component

## Goal

Extract the shared card layout and styles used by `LoginCard`, `forgot-password`, and `reset-password` into a single `AuthCard.svelte` component so all three auth screens share one source of truth for their visual style.

---

## Shared styles to extract

| Style concern | Currently duplicated in |
|---|---|
| Centered wrapper (flex, min-height, padding) | LoginCard, forgot-password, reset-password |
| Card shell (card-background, card-shadow, border-radius 12px, padding 40px, max-width 400px) | LoginCard, forgot-password, reset-password |
| Heading (2rem, centered, primary color) | LoginCard, forgot-password |
| `.field` label + input pattern | LoginCard, forgot-password |
| `.error` message style | LoginCard, forgot-password, reset-password |
| `.success` message style | forgot-password, reset-password |
| `.submit-row` (flex, justify-content: flex-end) | LoginCard, forgot-password |
| Footer divider section | LoginCard (.toggle-section), forgot-password (.back-section) |

---

## New component

**`src/lib/components/dedicated/app/AuthCard.svelte`**

Props:
- `title: string` -- rendered as `<h1>` inside the card

Renders:
- Wrapper div (centered flex layout)
- Card div with shared card styles
- `<h1>` from `title` prop
- `{@render children()}` for page-specific content

Provides global (unscoped) CSS classes for use by consumers:
- `.field` -- label + input column layout
- `.submit-row` -- right-aligned button row
- `.footer-section` -- top-bordered footer area
- `.error` -- error message block
- `.success` -- success message block

---

## Tasks

### Task 1 -- Create AuthCard component

File: `src/lib/components/dedicated/app/AuthCard.svelte`

- Accept `title: string` prop and `children` snippet
- Render centered wrapper + styled card + h1 from title
- Define shared global CSS classes listed above
- Use `:global()` so child components can apply them without importing

### Task 2 -- Refactor LoginCard to use AuthCard

File: `src/lib/components/dedicated/app/LoginCard.svelte`

- Import and wrap content in `<AuthCard title="Papersy">`
- Remove `.login-wrapper` and `.login-card` style blocks
- Replace `.error` style with shared class (AuthCard provides it)
- Replace `.submit-row` style with shared class
- Keep `.field` and `.toggle-section` either via shared classes or inline if divergent

### Task 3 -- Refactor forgot-password to use AuthCard

File: `src/routes/forgot-password/+page.svelte`

- Import and wrap content in `<AuthCard title="Forgot Password">`
- Remove `.forgot-password-wrapper` and `.forgot-password-card` style blocks
- Remove duplicate `.field`, `.error`, `.success`, `.submit-row` styles
- Rename `.back-section` to `.footer-section` to match shared class

### Task 4 -- Refactor reset-password to use AuthCard

File: `src/routes/reset-password/+page.svelte`

- Import and wrap content in `<AuthCard title="Reset Password">`
- Remove `.reset-password-container` and `.form-card` style blocks
- Add labels to password inputs to match LoginCard/forgot-password style
- Use shared `.field`, `.error`, `.success` classes from AuthCard

### Task 5 -- Update CLAUDE.md component registry

File: `src/lib/components/CLAUDE.md`

- Add `AuthCard` entry to the Quick Reference table with its props and purpose
