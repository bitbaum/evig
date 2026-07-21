/**
 * Blog authors — SSOT.
 *
 * A blog post is written by a real person, not a faceless "team". File-based
 * posts (`content/posts/*.md`) carry the author's SLUG in their `author:`
 * frontmatter; that slug resolves here to a display name and the account email
 * that links the byline to the person's public profile (`/members/<userId>`).
 *
 * Why email, not a hard-coded user id: user ids differ per environment (dev vs
 * prod), so a committed id would be wrong somewhere. The email is stable; the
 * id is resolved at render time (see `src/lib/blog/author.ts`). If no account
 * matches, the byline degrades gracefully to plain text.
 */

import { DEFAULT_BLOG_AUTHOR } from '@/config/org'

export interface BlogAuthorRecord {
  /** Frontmatter key + stable identifier. */
  slug: string
  /** Fallback display name (used when the account can't be resolved). */
  name: string
  /** Platform account email → resolves to the public profile. */
  email: string
  /** Optional one-line role shown under the name on the profile. */
  role?: string
}

// Posts carry no `author:` line and inherit DEFAULT_BLOG_AUTHOR (org.ts). We key
// the record on that same name so the byline resolves to a real profile — and
// keep the slug for any post that opts into an explicit `author:` reference.
export const BLOG_AUTHORS: Record<string, BlogAuthorRecord> = {
  'georgy-butaev': {
    slug: 'georgy-butaev',
    name: DEFAULT_BLOG_AUTHOR,
    email: 'georgy.butaev@revamp-it.ch',
  },
}

/**
 * Resolve a frontmatter `author` value to its record. Matches by slug first
 * (the canonical form), then by display name (back-compat for posts still
 * carrying a literal name). Returns null for unknown authors — the byline then
 * shows the raw string without a profile link.
 */
export function getBlogAuthorRecord(author: string | undefined | null): BlogAuthorRecord | null {
  if (!author) return null
  const key = author.trim()
  if (BLOG_AUTHORS[key]) return BLOG_AUTHORS[key]
  const lower = key.toLowerCase()
  return Object.values(BLOG_AUTHORS).find((a) => a.name.toLowerCase() === lower) ?? null
}
