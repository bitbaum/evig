/**
 * Public Identity — SSOT for a person's shared public profile fields.
 *
 * A person is one entity (ground truth #2). Their display name, avatar, bio and
 * verified status live ONCE, on `users` + `user_profiles`, regardless of which
 * role(s) they hold (seller, technician, buyer). Role tables
 * (seller_profiles / technician_profiles / team_profiles) hold only
 * role-specific data and must NOT re-store these identity fields.
 *
 * Any code that needs "who is this person, publicly" resolves it here — never by
 * reading display_name/avatar/bio/is_verified off a role table.
 */

import { db } from '@/db'
import { users, userProfiles } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export interface PublicIdentity {
  userId: string
  /** Account/legal name (users.name) — the fallback for displayName. */
  name: string | null
  /** Preferred public name (user_profiles.display_name). */
  displayName: string | null
  /** Public avatar (user_profiles.avatar_url), falling back to users.image. */
  avatarUrl: string | null
  bio: string | null
  isVerified: boolean
}

/** The name to show publicly: preferred display name → account name. */
export function resolveDisplayName(id: Pick<PublicIdentity, 'displayName' | 'name'>): string | null {
  return id.displayName || id.name
}

/**
 * Drizzle select fragment for the identity fields, for queries that already
 * join `users` LEFT JOIN `user_profiles`. Aliased in snake_case to match the
 * marketplace API row shape (seller_display_name etc. are built at the call
 * site). Import and spread into `.select({ ... })`.
 */
export const publicIdentityColumns = {
  display_name: userProfiles.displayName,
  avatar_url: userProfiles.avatarUrl,
  bio: userProfiles.bio,
  is_verified: userProfiles.isVerified,
} as const

/**
 * Resolve public identity for a set of users in one query. Returns a Map keyed
 * by userId; users with no user_profiles row still resolve (identity fields
 * null, isVerified false) via the LEFT JOIN.
 */
export async function getPublicIdentityMap(userIds: string[]): Promise<Map<string, PublicIdentity>> {
  const unique = [...new Set(userIds)].filter(Boolean)
  if (unique.length === 0) return new Map()

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      image: users.image,
      displayName: userProfiles.displayName,
      avatarUrl: userProfiles.avatarUrl,
      bio: userProfiles.bio,
      isVerified: userProfiles.isVerified,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(inArray(users.id, unique))

  return new Map(
    rows.map((r) => [
      r.userId,
      {
        userId: r.userId,
        name: r.name,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl ?? r.image,
        bio: r.bio,
        isVerified: !!r.isVerified,
      },
    ])
  )
}

/** Single-user convenience wrapper. */
export async function getPublicIdentity(userId: string): Promise<PublicIdentity | null> {
  const map = await getPublicIdentityMap([userId])
  return map.get(userId) ?? null
}
