/**
 * Teams domain service (SoC: business logic, no HTTP/JSX).
 *
 * One place owns the queries for the admin API and the server-component pages,
 * so the team / membership shapes never drift. Identity (name/avatar) is always
 * joined from users + user_profiles — never duplicated onto team rows.
 */

import { db } from '@/db'
import { teams, teamMemberships } from '@/db/schema/teams'
import { users, userProfiles } from '@/db/schema/auth'
import { teamProfiles } from '@/db/schema/team'
import { and, asc, desc, eq, isNull, sql, type SQL } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import {
  TEAM_ROLES,
  UNIQUE_TEAM_ROLES,
  slugifyTeamName,
  type TeamRole,
} from '@/config/teams'
import type {
  TeamListItem,
  TeamMemberRow,
  TeamDetail,
  MembershipForUser,
} from '@/lib/schemas/teams'

// Person display name: prefer the profile display_name, fall back to the account name.
const memberName = sql<string | null>`COALESCE(${userProfiles.displayName}, ${users.name})`

/** Live-membership count for a team (the "Aktive Mitglieder" badge). */
const liveMemberCount = sql<number>`(
  SELECT COUNT(*)::int FROM ${sql.raw(TABLE_NAMES.TEAM_MEMBERSHIPS)} m
  WHERE m.team_id = ${teams.id} AND m.left_at IS NULL
)`

/** Names of the current lead + deputy, if assigned (for the directory card). */
const leadNames = sql<string[]>`(
  SELECT COALESCE(ARRAY_AGG(COALESCE(up.display_name, u.name) ORDER BY m.role), '{}')
  FROM ${sql.raw(TABLE_NAMES.TEAM_MEMBERSHIPS)} m
  JOIN ${sql.raw(TABLE_NAMES.USERS)} u ON u.id = m.user_id
  LEFT JOIN ${sql.raw(TABLE_NAMES.USER_PROFILES)} up ON up.user_id = u.id
  WHERE m.team_id = ${teams.id} AND m.left_at IS NULL AND m.role IN ('lead','deputy')
)`

// ---- Teams ------------------------------------------------------------------

export async function listTeams(includeInactive = false): Promise<TeamListItem[]> {
  const rows = await db
    .select({
      id: teams.id,
      slug: teams.slug,
      name: teams.name,
      purpose: teams.purpose,
      mail_folders: teams.mailFolders,
      accent: teams.accent,
      is_active: teams.isActive,
      sort_order: teams.sortOrder,
      member_count: liveMemberCount,
      lead_names: leadNames,
      created_at: teams.createdAt,
      updated_at: teams.updatedAt,
    })
    .from(teams)
    .where(includeInactive ? undefined : eq(teams.isActive, true))
    .orderBy(asc(teams.sortOrder), asc(teams.name))

  return rows as TeamListItem[]
}

function selectTeamDetail(where: SQL): Promise<TeamDetail | null> {
  return db
    .select({
      id: teams.id,
      slug: teams.slug,
      name: teams.name,
      purpose: teams.purpose,
      mail_folders: teams.mailFolders,
      accent: teams.accent,
      meeting_cadence: teams.meetingCadence,
      current_focus: teams.currentFocus,
      current_focus_updated_at: teams.currentFocusUpdatedAt,
      is_active: teams.isActive,
      sort_order: teams.sortOrder,
      created_at: teams.createdAt,
      updated_at: teams.updatedAt,
    })
    .from(teams)
    .where(where)
    .limit(1)
    .then((r) => (r[0] as TeamDetail) ?? null)
}

export function getTeam(id: string): Promise<TeamDetail | null> {
  return selectTeamDetail(eq(teams.id, id))
}

export function getTeamBySlug(slug: string): Promise<TeamDetail | null> {
  return selectTeamDetail(eq(teams.slug, slug))
}

/** Derive a unique slug from the name (or a provided slug), suffixing on clash. */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugifyTeamName(base) || 'team'
  let candidate = root
  let n = 2
  // Small teams table — a short loop is fine and keeps it correct.
  while (true) {
    const clash = await db
      .select({ id: teams.id })
      .from(teams)
      .where(exceptId ? and(eq(teams.slug, candidate), sql`${teams.id} <> ${exceptId}`) : eq(teams.slug, candidate))
      .limit(1)
    if (clash.length === 0) return candidate
    candidate = `${root}-${n++}`
  }
}

export async function createTeam(input: {
  name: string
  slug?: string
  purpose?: string | null
  mail_folders?: string[]
  accent: string
  meeting_cadence?: string | null
  is_active?: boolean
  sort_order?: number
}): Promise<TeamDetail> {
  const slug = await uniqueSlug(input.slug || input.name)
  const [row] = await db
    .insert(teams)
    .values({
      slug,
      name: input.name,
      purpose: input.purpose ?? null,
      mailFolders: input.mail_folders ?? [],
      accent: input.accent,
      meetingCadence: input.meeting_cadence ?? null,
      isActive: input.is_active ?? true,
      sortOrder: input.sort_order ?? 0,
    })
    .returning({ id: teams.id })
  return (await getTeam(row.id))!
}

export async function updateTeam(id: string, input: Record<string, unknown>): Promise<TeamDetail | null> {
  const fieldMap: Record<string, string> = {
    name: 'name',
    purpose: 'purpose',
    mail_folders: 'mailFolders',
    accent: 'accent',
    meeting_cadence: 'meetingCadence',
    is_active: 'isActive',
    sort_order: 'sortOrder',
  }
  const set: Record<string, unknown> = {}
  for (const [snake, camel] of Object.entries(fieldMap)) {
    if (snake in input) set[camel] = input[snake] ?? null
  }
  // A renamed team keeps its slug (stable URL); only re-slug on explicit request.
  if (typeof input.slug === 'string' && input.slug) {
    set.slug = await uniqueSlug(input.slug, id)
  }
  if (Object.keys(set).length === 0) return getTeam(id)
  set.updatedAt = sql`NOW()`
  await db.update(teams).set(set).where(eq(teams.id, id))
  return getTeam(id)
}

/** Soft-delete: hide the team; membership history is preserved. */
export async function deactivateTeam(id: string): Promise<boolean> {
  const [row] = await db
    .update(teams)
    .set({ isActive: false, updatedAt: sql`NOW()` })
    .where(eq(teams.id, id))
    .returning({ id: teams.id })
  return !!row
}

export async function updateTeamFocus(id: string, focus: string | null): Promise<TeamDetail | null> {
  await db
    .update(teams)
    .set({
      currentFocus: focus && focus.trim() ? focus.trim() : null,
      currentFocusUpdatedAt: focus && focus.trim() ? sql`NOW()` : null,
      updatedAt: sql`NOW()`,
    })
    .where(eq(teams.id, id))
  return getTeam(id)
}

// ---- Membership -------------------------------------------------------------

export interface StaffCandidate {
  user_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
}

/** Staff members eligible to be added to a team (the member picker source). */
export async function listStaffCandidates(): Promise<StaffCandidate[]> {
  const rows = await db
    .select({
      user_id: users.id,
      name: memberName,
      email: users.email,
      avatar_url: userProfiles.avatarUrl,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.isStaff, true))
    .orderBy(asc(memberName))
  return rows as StaffCandidate[]
}

/** Staff who are not in any team — the "Ohne Team" column on the assignment board. */
export async function listStaffWithoutTeam(): Promise<TeamMemberRow[]> {
  const rows = await db
    .select({
      membership_id: sql<string>`NULL`,
      user_id: users.id,
      role: sql<string>`NULL`,
      joined_at: sql<string>`NULL`,
      name: memberName,
      email: users.email,
      avatar_url: userProfiles.avatarUrl,
      position: teamProfiles.position,
      work_state: teamProfiles.workState,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(teamProfiles, eq(teamProfiles.userId, users.id))
    .where(and(
      eq(users.isStaff, true),
      sql`NOT EXISTS (
        SELECT 1 FROM ${sql.raw(TABLE_NAMES.TEAM_MEMBERSHIPS)} m
        WHERE m.user_id = ${users.id} AND m.left_at IS NULL
      )`,
    ))
    .orderBy(asc(memberName))
  return rows as TeamMemberRow[]
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  const rows = await db
    .select({
      membership_id: teamMemberships.id,
      user_id: teamMemberships.userId,
      role: teamMemberships.role,
      joined_at: teamMemberships.joinedAt,
      name: memberName,
      email: users.email,
      avatar_url: userProfiles.avatarUrl,
      position: teamProfiles.position,
      work_state: teamProfiles.workState,
    })
    .from(teamMemberships)
    .innerJoin(users, eq(teamMemberships.userId, users.id))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(teamProfiles, eq(teamProfiles.userId, users.id))
    .where(and(eq(teamMemberships.teamId, teamId), isNull(teamMemberships.leftAt)))
    // Leads first (lead < deputy < member alphabetically works for these values), then name.
    .orderBy(asc(teamMemberships.role), asc(memberName))

  return rows as TeamMemberRow[]
}

export async function getMembershipsForUser(userId: string): Promise<MembershipForUser[]> {
  const rows = await db
    .select({
      membership_id: teamMemberships.id,
      team_id: teams.id,
      slug: teams.slug,
      team_name: teams.name,
      accent: teams.accent,
      role: teamMemberships.role,
      joined_at: teamMemberships.joinedAt,
    })
    .from(teamMemberships)
    .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
    .where(and(eq(teamMemberships.userId, userId), isNull(teamMemberships.leftAt)))
    .orderBy(asc(teams.sortOrder), asc(teams.name))

  return rows as MembershipForUser[]
}

/** Find the live membership row for a (team, user), if any. */
async function findLiveMembership(teamId: string, userId: string) {
  const [row] = await db
    .select({ id: teamMemberships.id, role: teamMemberships.role })
    .from(teamMemberships)
    .where(and(
      eq(teamMemberships.teamId, teamId),
      eq(teamMemberships.userId, userId),
      isNull(teamMemberships.leftAt),
    ))
    .limit(1)
  return row ?? null
}

/**
 * Keep the "≤1 lead + ≤1 deputy per team" invariant: when someone takes a
 * unique role, demote whoever currently holds it (except the given membership).
 * Enforced here, not in SQL (enum semantics stay out of the schema).
 */
async function demoteExistingRoleHolder(teamId: string, role: string, exceptMembershipId?: string) {
  if (!(UNIQUE_TEAM_ROLES as string[]).includes(role)) return
  const conds: SQL[] = [
    eq(teamMemberships.teamId, teamId),
    eq(teamMemberships.role, role),
    isNull(teamMemberships.leftAt),
  ]
  if (exceptMembershipId) conds.push(sql`${teamMemberships.id} <> ${exceptMembershipId}`)
  await db
    .update(teamMemberships)
    .set({ role: TEAM_ROLES.MEMBER, updatedAt: sql`NOW()` })
    .where(and(...conds))
}

/**
 * Add a person to a team (idempotent). If they already have a live membership,
 * their role is updated instead of inserting a duplicate.
 */
export async function addMember(teamId: string, userId: string, role: TeamRole = TEAM_ROLES.MEMBER) {
  const existing = await findLiveMembership(teamId, userId)
  if (existing) {
    await demoteExistingRoleHolder(teamId, role, existing.id)
    await db
      .update(teamMemberships)
      .set({ role, updatedAt: sql`NOW()` })
      .where(eq(teamMemberships.id, existing.id))
    return { id: existing.id, reused: true }
  }
  await demoteExistingRoleHolder(teamId, role)
  const [row] = await db
    .insert(teamMemberships)
    .values({ teamId, userId, role })
    .returning({ id: teamMemberships.id })
  return { id: row.id, reused: false }
}

export async function changeMemberRole(teamId: string, membershipId: string, role: TeamRole): Promise<boolean> {
  await demoteExistingRoleHolder(teamId, role, membershipId)
  const [row] = await db
    .update(teamMemberships)
    .set({ role, updatedAt: sql`NOW()` })
    .where(and(
      eq(teamMemberships.id, membershipId),
      eq(teamMemberships.teamId, teamId),
      isNull(teamMemberships.leftAt),
    ))
    .returning({ id: teamMemberships.id })
  return !!row
}

/** Soft-leave: close the live membership (preserves history for the board/audit). */
export async function removeMember(teamId: string, membershipId: string): Promise<boolean> {
  const [row] = await db
    .update(teamMemberships)
    .set({ leftAt: sql`NOW()`, updatedAt: sql`NOW()` })
    .where(and(
      eq(teamMemberships.id, membershipId),
      eq(teamMemberships.teamId, teamId),
      isNull(teamMemberships.leftAt),
    ))
    .returning({ id: teamMemberships.id })
  return !!row
}

/**
 * Transfer a person between teams (person-side action). Closes the old live
 * membership (if given) and opens a new one in the target team. History is kept.
 */
export async function transferMembership(
  userId: string,
  input: { from_team_id?: string | null; to_team_id: string; role?: TeamRole },
) {
  if (input.from_team_id) {
    const from = await findLiveMembership(input.from_team_id, userId)
    if (from) await removeMember(input.from_team_id, from.id)
  }
  return addMember(input.to_team_id, userId, input.role ?? TEAM_ROLES.MEMBER)
}
