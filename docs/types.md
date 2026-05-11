# Types & Utilities

Shared TypeScript types and utility constants. Import via `$lib/utils/types`.

## types.ts

### Utility Types

**`NoUndefinedField<T>`** — Utility mapped type. Recursively strips `undefined` and `null` from every field of `T`.

### UI Types

**`SparkleType`** — Shape of a single sparkle animation instance: `{ id, createdAt, color, size, style: { top, left } }`

**`TagType`** — UI tag: `{ label: string; color?: 'primary' | 'secondary' }`. Note: blog post tags are plain `string[]`, not `TagType[]`.

**`SocialLink`** — Currently an empty type (`{}`). Placeholder.

### Content Types

**`Feature`** — Feature card entry: `{ name, description, image, tags: TagType[] }`

**`BlogPost`** — Full processed blog post: `{ tags, keywords, hidden, slug, title, date, updated, excerpt, html?, readingTime, relatedPosts, coverImage? }`

### App-Specific Types

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

**`ChatMessage`** — Single chat message:
```ts
{
  role: 'user' | 'ai'
  text: string
  loading?: boolean
}
```

**`Mode`** — Page mode type: `type Mode = 'summary' | 'chat'`

## regex.ts

**`HttpRegex`** — `RegExp = /^((http|https):\/\/)/` — Matches strings that begin with `http://` or `https://`. Used by `Button.svelte` and `Card.svelte` to detect external links.
