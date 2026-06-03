/**
 * Public Projects — SSOT for need types and statuses (machine values only)
 *
 * Mirrors the CHECK constraints in migration 082. Adding a value here
 * requires:
 *   1. update the constant below
 *   2. ALTER the matching CHECK constraint via a new migration
 *   3. add the human label to messages/<locale>.json (admin.projects.*)
 *
 * Labels intentionally live in i18n (not here). The earlier convention
 * in tasks.ts kept labels alongside constants — for project-scoped enums
 * we keep this layer purely about machine values so admin (DE) and public
 * (per-locale) pull from a single source: the messages files.
 */

// =============================================================================
// NEED TYPES — what kind of resource a project is asking for
// =============================================================================

export const NEED_TYPES = {
  EXPERTISE:       'expertise',
  HARDWARE:        'hardware',
  PARTNER_INTRO:   'partner_intro',
  FUNDING:         'funding',
  VOLUNTEER_TIME:  'volunteer_time',
} as const

export type NeedType = (typeof NEED_TYPES)[keyof typeof NEED_TYPES]

// =============================================================================
// NEED STATUSES — lifecycle of a single need
// =============================================================================

export const NEED_STATUSES = {
  OPEN:       'open',
  MATCHED:    'matched',
  FULFILLED:  'fulfilled',
  ARCHIVED:   'archived',
} as const

export type NeedStatus = (typeof NEED_STATUSES)[keyof typeof NEED_STATUSES]

// =============================================================================
// CONTRIBUTION STATUSES — triage states for visitor offers
// =============================================================================

export const CONTRIBUTION_STATUSES = {
  NEW:        'new',
  CONTACTED:  'contacted',
  ACCEPTED:   'accepted',
  DECLINED:   'declined',
} as const

export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[keyof typeof CONTRIBUTION_STATUSES]
