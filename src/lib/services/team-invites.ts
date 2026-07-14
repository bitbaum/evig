/**
 * Placeholder-claim invites (SoC: business logic, no HTTP/JSX).
 *
 * A real person "takes over" a placeholder account via a single-use invite link.
 * The account row (and therefore every team membership, which keys on user_id)
 * is preserved — only name/email/password change. Reuses the existing
 * verification_tokens table (no migration) with a `claim:` identifier prefix so
 * it never collides with email-verify / password-reset tokens.
 */

import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema/auth'
import { teams, teamMemberships } from '@/db/schema/teams'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import { generateToken, hashPassword } from '@/lib/auth/password'
import { isPlaceholderEmail, getTeamRoleLabel } from '@/config/teams'

const CLAIM_PREFIX = 'claim:'
const CLAIM_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export interface ClaimInvite {
  userId: string
  currentName: string | null
  teams: { name: string; role: string; roleLabel: string }[]
}

/**
 * Mint a single-use claim token for a placeholder user. Returns null if the
 * user doesn't exist or is already a real (claimed) account.
 */
export async function createClaimToken(userId: string): Promise<string | null> {
  const [u] = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  // Only un-claimed placeholders may be invited (a set password = already real).
  if (!u || !isPlaceholderEmail(u.email) || u.passwordHash) return null

  const identifier = CLAIM_PREFIX + userId
  const token = generateToken(48)
  const expires = new Date(Date.now() + CLAIM_TTL_MS).toISOString()

  // One active invite per placeholder — drop any prior link.
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier))
  await db.insert(verificationTokens).values({ identifier, token, expires })
  return token
}

/** Resolve a claim token to the invite (user + the teams they'll join). Null if invalid/expired. */
export async function getClaimInvite(token: string): Promise<ClaimInvite | null> {
  const [row] = await db
    .select({ identifier: verificationTokens.identifier })
    .from(verificationTokens)
    .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expires, sql`NOW()`)))
    .limit(1)
  if (!row || !row.identifier.startsWith(CLAIM_PREFIX)) return null

  const userId = row.identifier.slice(CLAIM_PREFIX.length)
  const [u] = await db
    .select({ name: users.name, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  // Race guard: user gone or already claimed → token is dead.
  if (!u || !isPlaceholderEmail(u.email) || u.passwordHash) return null

  const memberships = await db
    .select({ name: teams.name, role: teamMemberships.role })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .where(and(eq(teamMemberships.userId, userId), isNull(teamMemberships.leftAt)))
    .orderBy(asc(teams.sortOrder))

  return {
    userId,
    currentName: u.name,
    teams: memberships.map((m) => ({ name: m.name, role: m.role, roleLabel: getTeamRoleLabel(m.role) })),
  }
}

export interface ClaimResult { success: boolean; error?: string }

/**
 * Consume a claim token: turn the placeholder into a real account (name, email,
 * password) and verify it. Memberships are untouched (same user_id).
 */
export async function consumeClaim(
  token: string,
  input: { name: string; email: string; password: string },
): Promise<ClaimResult> {
  const [row] = await db
    .select({ identifier: verificationTokens.identifier })
    .from(verificationTokens)
    .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expires, sql`NOW()`)))
    .limit(1)
  if (!row || !row.identifier.startsWith(CLAIM_PREFIX)) {
    return { success: false, error: 'Ungültiger oder abgelaufener Einladungslink' }
  }
  const userId = row.identifier.slice(CLAIM_PREFIX.length)
  const email = input.email.toLowerCase().trim()

  // The new address must be free (CITEXT email is case-insensitive-unique).
  const [clash] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), sql`${users.id} <> ${userId}`))
    .limit(1)
  if (clash) return { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet.' }

  const passwordHash = await hashPassword(input.password)
  const [updated] = await db
    .update(users)
    .set({
      name: input.name.trim(),
      email,
      passwordHash,
      emailVerified: sql`NOW()`.mapWith(String),
      updatedAt: sql`NOW()`.mapWith(String),
    })
    // Guard: still a placeholder (defends against double-submit / race).
    .where(and(eq(users.id, userId), isNull(users.passwordHash)))
    .returning({ id: users.id })
  if (!updated) return { success: false, error: 'Dieses Konto wurde bereits übernommen.' }

  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))
  return { success: true }
}
