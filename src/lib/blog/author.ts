/**
 * Blog author resolution (server-only).
 *
 * Turns a post's raw `author` reference into a display name + a link target to
 * the author's public profile. Two inputs feed in:
 *   - `authorRaw`  — frontmatter slug (file posts) or account name (DB posts)
 *   - `dbAuthorId` — the account id already known for DB posts (`created_by`)
 *
 * For file posts we look up the account id by the author's configured email.
 * The lookup is wrapped in React `cache()` so a page listing many posts by the
 * same author hits the database at most once per request.
 */

import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getBlogAuthorRecord } from '@/config/blog-authors'

export interface ResolvedAuthor {
  /** Display name shown in the byline. */
  name: string
  /** Public profile account id, or null when the author has no linkable account. */
  profileId: string | null
  /** Optional role/title under the name. */
  role?: string
}

const accountIdByEmail = cache(async (email: string): Promise<string | null> => {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  return row?.id ?? null
})

export async function resolveAuthorProfile(
  authorRaw: string | undefined,
  dbAuthorId?: string | null,
): Promise<ResolvedAuthor> {
  const record = getBlogAuthorRecord(authorRaw)
  if (record) {
    const profileId = dbAuthorId ?? (await accountIdByEmail(record.email))
    return { name: record.name, profileId, role: record.role }
  }
  // Unknown author: keep the raw label; still link to the DB account if present.
  return { name: authorRaw?.trim() || 'Revamp-IT', profileId: dbAuthorId ?? null }
}
