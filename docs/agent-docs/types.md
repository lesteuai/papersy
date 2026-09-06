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

**`JobStatus`** — Enum reused for document ingestion status: `Pending = 'pending'`, `Processing = 'processing'`, `Storing = 'storing'`, `Done = 'done'`, `Failed = 'failed'`, `Cancelled = 'cancelled'`. There is no longer a separate `job` table; `document.status` stores one of these values directly.

**`Project`** — A user's project:
```ts
{
  id: string
  name: string
  createdAt?: string
}
```

**`Session`** — A chat session inside a project:
```ts
{
  id: string
  projectId: string
  name: string | null       // null means not named by the user
  label: string             // derived server-side: name, else truncated first user message, else "New chat"
  createdAt?: string
}
```

**`Document`** — A knowledge base document:
```ts
{
  id: string
  name: string
  kind: 'pdf' | 'markdown' | 'text'
  status: JobStatus
  error?: string | null
}
```

**`ChatMessage`** — Single chat message:
```ts
{
  role: 'user' | 'assistant'
  text: string
  loading?: boolean
}
```

`role` is `'user' | 'assistant'`, not the old `'ai'`. `SummaryData`, `PapersyFile` and `Mode` are gone; there is no paper summarization concept left anywhere in the types.

## session-label.ts

**`sessionLabel(name, firstUserMessage?)`** → `string` — Pure function: returns `name` if set, else `firstUserMessage` truncated to 60 characters with `...` appended when longer, else the placeholder `"New chat"`.

**`validateName(raw)`** → `{ ok: true; value: string } | { ok: false; message: string }` — Trims `raw` and requires 1-100 characters after trimming. Used for both project names and session names.

## regex.ts

**`HttpRegex`** — `RegExp = /^((http|https):\/\/)/` — Matches strings that begin with `http://` or `https://`. Used by `Button.svelte` and `Card.svelte` to detect external links.
