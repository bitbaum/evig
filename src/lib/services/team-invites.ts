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
import {
  isPlaceholderEmail,
  getTeamRoleLabel,
  slugifyTeamName,
  PLACEHOLDER_EMAIL_DOMAIN,
  TEAM_ROLES,
  type TeamRole,
} from '@/config/teams'
import { createUser, getUserByEmail, getUserById } from '@/lib/auth/db-users'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { ROUTES } from '@/config/routes'
import { logger } from '@/lib/logger'
import { addMember, getTeam } from './teams'

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

// ---- Email delivery ----------------------------------------------------------

/** Absolute claim URL. The delivery address prefills the claim form's email field. */
export function buildClaimUrl(token: string, prefillEmail?: string): string {
  const url = new URL(`/einladung/${token}`, APP_URL)
  if (prefillEmail) url.searchParams.set('email', prefillEmail)
  return url.toString()
}

/** Names of the teams a user is currently a live member of (for invite emails). */
async function listLiveTeamNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: teams.name })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .where(and(eq(teamMemberships.userId, userId), isNull(teamMemberships.leftAt)))
    .orderBy(asc(teams.sortOrder))
  return rows.map((r) => r.name)
}

export interface EmailedClaimInvite {
  token: string
  /** false when the token was minted but the email could not be sent. */
  emailed: boolean
}

/**
 * Mint a claim token for a placeholder and email the claim link to the given
 * (real) address. Returns null when the user isn't an invitable placeholder.
 */
export async function emailClaimInvite(
  userId: string,
  deliveryEmail: string,
  inviterName: string,
): Promise<EmailedClaimInvite | null> {
  const token = await createClaimToken(userId)
  if (!token) return null
  const teamNames = await listLiveTeamNames(userId)
  const res = await sendEmail(
    deliveryEmail,
    'teamClaimInvite',
    inviterName,
    teamNames,
    buildClaimUrl(token, deliveryEmail),
  )
  return { token, emailed: res.success }
}

// ---- Invite by email ----------------------------------------------------------

/**
 * A collision-free stand-in address for a freshly invited person. The real
 * address is only used for delivery; it becomes the account email at claim time.
 */
function makePlaceholderAddress(name: string): string {
  const slug = slugifyTeamName(name) || 'mitglied'
  return `${slug}-${generateToken(4)}@${PLACEHOLDER_EMAIL_DOMAIN}`
}

export interface InviteByEmailInput {
  teamId: string
  name: string
  email: string
  role?: TeamRole
  inviterName: string
}

export type InviteByEmailResult =
  | { outcome: 'added_existing'; userId: string }
  | { outcome: 'invited'; userId: string; token: string; emailed: boolean }
  | { outcome: 'error'; error: string }

/**
 * Invite a person into a team by name + email:
 * - already registered (and staff) → added to the team directly, notified by email
 * - unknown address → a placeholder account is created with the membership and
 *   a claim link is emailed; registering via that link completes the account
 *   (same user_id, membership preserved — the one unified onboarding path).
 */
export async function inviteByEmail(input: InviteByEmailInput): Promise<InviteByEmailResult> {
  const email = input.email.toLowerCase().trim()
  if (isPlaceholderEmail(email)) {
    return { outcome: 'error', error: 'Platzhalter-Adressen können nicht eingeladen werden.' }
  }
  const team = await getTeam(input.teamId)
  if (!team) return { outcome: 'error', error: 'Team nicht gefunden.' }
  const role = input.role ?? TEAM_ROLES.MEMBER

  const existing = await getUserByEmail(email)
  if (existing) {
    if (!existing.is_staff) {
      return {
        outcome: 'error',
        error:
          'Diese E-Mail-Adresse gehört zu einem bestehenden Konto ohne Staff-Zugang. Bitte zuerst den Staff-Zugang klären.',
      }
    }
    await addMember(input.teamId, existing.id, role)
    const teamUrl = new URL(ROUTES.admin.teamBySlug(team.slug), APP_URL).toString()
    const res = await sendEmail(email, 'teamMemberAdded', team.name, teamUrl, input.inviterName)
    if (!res.success) {
      logger.warn('Team membership notification email failed', { email, teamId: input.teamId })
    }
    return { outcome: 'added_existing', userId: existing.id }
  }

  // New person: placeholder account + membership now, claim link by email.
  const placeholder = await createUser({
    email: makePlaceholderAddress(input.name),
    name: input.name.trim(),
    is_staff: true,
  })
  await addMember(input.teamId, placeholder.id, role)
  const invite = await emailClaimInvite(placeholder.id, email, input.inviterName)
  if (!invite) {
    // Should not happen for a just-created placeholder; surface it if it does.
    return { outcome: 'error', error: 'Einladung konnte nicht erstellt werden.' }
  }
  return { outcome: 'invited', userId: placeholder.id, ...invite }
}

/**
 * Notify an already-registered person that they were added to a team.
 * Fire-and-forget side effect: placeholders (no real inbox) are skipped.
 */
export async function notifyMemberAdded(teamId: string, userId: string, addedByName: string): Promise<void> {
  const [user, team] = await Promise.all([getUserById(userId), getTeam(teamId)])
  if (!user || !team || isPlaceholderEmail(user.email)) return
  const teamUrl = new URL(ROUTES.admin.teamBySlug(team.slug), APP_URL).toString()
  const res = await sendEmail(user.email, 'teamMemberAdded', team.name, teamUrl, addedByName)
  if (!res.success) {
    logger.warn('Team membership notification email failed', { userId, teamId })
  }
}
