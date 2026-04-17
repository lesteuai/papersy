# src/lib/utils

Shared TypeScript types and utility constants used across the entire `src/lib/` tree and routes.

---

## Maintenance

**Keep this file up to date.** Whenever you add, remove, or change a type in `types.ts` or add/modify a utility in this folder, update this file. If a change affects how the shared library is documented at a higher level, update [src/lib/CLAUDE.md](../CLAUDE.md) as well.

---

## types.ts

Central type definitions. Import via `$lib/utils/types`.

### `NoUndefinedField<T>`
Utility mapped type. Recursively strips `undefined` and `null` from every field of `T`.
```ts
type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> }
```

### `SparkleType`
Shape of a single sparkle animation instance, used internally by `Sparkles.svelte` and `SingleSparkle.svelte`.
```ts
{
  id: string
  createdAt: number
  color: string
  size: number
  style: any          // { top: string, left: string }
}
```

### `TagType`
UI tag with optional color. Used by `Feature` and `FeatureCard`.
```ts
{
  label: string
  color?: 'primary' | 'secondary'
}
```
Note: blog post tags (`BlogPost.tags`) are plain `string[]`, not `TagType[]`.

### `SocialLink`
Currently an **empty type** (`{}`). Placeholder — no fields defined yet.

### `Feature`
Shape of a feature card entry. Used by `features.ts` and `Features.svelte`.
```ts
{
  name: string
  description: string
  image: string        // path relative to /static, e.g. 'images/features/markdown.jpg'
  tags: TagType[]      // declared required; some data entries omit it (type-cast suppresses error)
}
```

### `BlogPost`
Full shape of a processed blog post. Returned by `importPosts` / `filterPosts`.
```ts
{
  tags: string[]
  keywords: string[]
  hidden: boolean
  slug: string
  title: string
  date: string
  updated: string
  excerpt: string
  html: string | undefined       // only populated when importPosts(render=true)
  readingTime: string            // e.g. '3 min read'; populated by filterPosts
  relatedPosts: BlogPost[]       // populated by filterPosts; up to 3 posts
  coverImage: string | undefined // path to cover image
}
```

### `SummaryData`
Summary extracted from a research paper by the LLM. Used by `src/routes/+page.svelte` and content panels.
```ts
{
  summary: string
  keyFindings: string[]
  methodology: string
  limitations: string
  references: string[]
}
```

### `PapersyFile`
Frontend representation of a paper file with metadata and job tracking. Used throughout the app UI.
```ts
{
  id: string
  name: string
  summaryData?: SummaryData
  jobId?: string                         // UUID of the processing job
  jobStatus?: string                     // 'pending' | 'processing' | 'failed' | undefined (done)
}
```

### `ChatMessage`
Single message in a conversation. Used by chat components.
```ts
{
  role: 'user' | 'ai'
  text: string
  loading?: boolean                      // true: render animated dots instead of text
}
```

### `Mode`
Page content mode — determines which view to show.
```ts
type Mode = 'summary' | 'chat'
```

---

## regex.ts

Export: `HttpRegex: RegExp = /^((http|https):\/\/)/`

Matches strings that begin with `http://` or `https://`. Used by `Button.svelte` and `Card.svelte` to detect external links and auto-set `target="_blank"` and `rel="noopener noreferrer"`.
