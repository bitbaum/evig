/**
 * Teams Configuration — SINGLE SOURCE OF TRUTH
 *
 * All team-related enums, labels and badge colours live here. This config + zod
 * at the write boundary is the ONLY enum authority — the DB columns are plain
 * TEXT with no CHECK constraint (per CLAUDE.md §DB). Adding a role needs no
 * migration.
 *
 * Mirrors the shape of src/config/deliverables.ts.
 */

import type { SectionColor } from '@/config/sections'

// ---- Membership role --------------------------------------------------------
// Maps the Teamsliste's "Teamverantwortliche (2x: 1 Haupt, 1 Vertretung)" +
// "Teilnehmer*innen" onto lead / deputy / member.

export const TEAM_ROLES = {
  LEAD: 'lead',
  DEPUTY: 'deputy',
  MEMBER: 'member',
} as const

export type TeamRole = (typeof TEAM_ROLES)[keyof typeof TEAM_ROLES]

export const TEAM_ROLE_OPTIONS = Object.values(TEAM_ROLES)

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  lead: 'Hauptverantwortliche/r',
  deputy: 'Stellvertretung',
  member: 'Mitglied',
}

export const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
  lead: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  deputy: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  member: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
}

/** Sort order for grouping members on a team page (leads first). */
export const TEAM_ROLE_SORT: Record<TeamRole, number> = {
  lead: 0,
  deputy: 1,
  member: 2,
}

/** The two roles that must be unique per team (≤1 each) — enforced in the service. */
export const UNIQUE_TEAM_ROLES: TeamRole[] = [TEAM_ROLES.LEAD, TEAM_ROLES.DEPUTY]

// ---- Goal status ------------------------------------------------------------
// App-level enum (plain TEXT column, no SQL CHECK — this config + zod is the
// authority). Adding a status needs no migration.

export const GOAL_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const

export type GoalStatus = (typeof GOAL_STATUS)[keyof typeof GOAL_STATUS]

export const GOAL_STATUS_OPTIONS = Object.values(GOAL_STATUS)

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erreicht',
}

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  open: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  in_progress: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  done: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
}

export function getGoalStatusLabel(status: string | null | undefined): string {
  if (!status) return GOAL_STATUS_LABELS.open
  return GOAL_STATUS_LABELS[status as GoalStatus] ?? status
}

export function getGoalStatusColor(status: string | null | undefined): string {
  if (!status) return GOAL_STATUS_COLORS.open
  return GOAL_STATUS_COLORS[status as GoalStatus] ?? GOAL_STATUS_COLORS.open
}

// ---- Accent (semantic colour KEY, resolved to classes here) -----------------
// A team's accent is a SectionColor key stored in the DB (e.g. 'info'), never a
// class string or hex — so a design-token change never touches team rows.

export const TEAM_ACCENT_OPTIONS: SectionColor[] = [
  'primary',
  'secondary',
  'info',
  'warning',
  'success',
  'error',
  'neutral',
]

/** Human labels for team accents (form select + AI prompt option list). */
export const TEAM_ACCENT_LABELS: Record<SectionColor, string> = {
  primary: 'Grün (primär)',
  secondary: 'Orange (sekundär)',
  info: 'Blau',
  warning: 'Gelb',
  success: 'Grün (Erfolg)',
  error: 'Rot',
  neutral: 'Neutral',
}

/** Chip/badge classes for a team accent (used on team cards + headers). */
export const TEAM_ACCENT_CLASSES: Record<SectionColor, string> = {
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
  info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  error: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
  neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
}

// ---- Helpers ----------------------------------------------------------------

export function getTeamRoleLabel(role: string | null | undefined): string {
  if (!role) return TEAM_ROLE_LABELS.member
  return TEAM_ROLE_LABELS[role as TeamRole] ?? role
}

export function getTeamRoleColor(role: string | null | undefined): string {
  if (!role) return TEAM_ROLE_COLORS.member
  return TEAM_ROLE_COLORS[role as TeamRole] ?? TEAM_ROLE_COLORS.member
}

export function getAccentClasses(accent: string | null | undefined): string {
  if (!accent) return TEAM_ACCENT_CLASSES.info
  return TEAM_ACCENT_CLASSES[accent as SectionColor] ?? TEAM_ACCENT_CLASSES.info
}

// ---- Placeholder accounts ---------------------------------------------------
// A placeholder is a locked stand-in user (password_hash NULL) that a real
// person claims later via an invite link. The email domain is the SINGLE marker
// (SSOT) — never hardcode this string anywhere else; use isPlaceholderEmail().

export const PLACEHOLDER_EMAIL_DOMAIN = 'placeholder.revamp-it.ch'

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)
}

/** URL-safe ASCII slug from a team name (no umlauts — slugs are path segments). */
export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
