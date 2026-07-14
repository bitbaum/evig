import { pgTable, uuid, text, boolean, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

// =============================================================================
// TEAMS (first-class teams)
// =============================================================================
// Each team owns a set of Nextcloud mail folders and has members (via
// team_memberships). Replaces the single team_profiles.department string.
// The membership `role` enum lives in src/config/teams.ts + zod — the column is
// plain text with NO CHECK constraint (per CLAUDE.md §DB).

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** URL-safe identifier used in /admin/teams/<slug> (ASCII only). */
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  purpose: text('purpose'),
  /** Nextcloud mail folders this team owns. NOT unique across teams — some are shared. */
  mailFolders: text('mail_folders').array().notNull().default(sql`'{}'`),
  /** Semantic colour key (SectionColor) resolved to classes in config — never a class string/hex. */
  accent: text('accent').notNull().default('info'),
  meetingCadence: text('meeting_cadence'),
  /** Team-level focus headline (separate from each member's own focus). */
  currentFocus: text('current_focus'),
  currentFocusUpdatedAt: timestamp('current_focus_updated_at', { withTimezone: true, mode: 'string' }),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_teams_active').on(table.isActive),
])

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert

// =============================================================================
// TEAM MEMBERSHIPS (many-to-many person ↔ team)
// =============================================================================
// left_at IS NULL = live membership; a set left_at is transfer/leave history.
// Partial unique keeps at most one live membership per (team, person).

export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  /** Keyed to users(id), not team_profiles — membership can exist before an HR profile does. */
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Values: lead | deputy | member. Enum authority is src/config/teams.ts + zod. */
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  /** NULL = live; set on transfer/leave to preserve history. */
  leftAt: timestamp('left_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_team_memberships_team').on(table.teamId),
  index('idx_team_memberships_user').on(table.userId),
  uniqueIndex('uq_team_memberships_live')
    .on(table.teamId, table.userId)
    .where(sql`left_at IS NULL`),
])

export type TeamMembership = typeof teamMemberships.$inferSelect
export type NewTeamMembership = typeof teamMemberships.$inferInsert
