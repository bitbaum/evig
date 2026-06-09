/**
 * Monitor-Upcycling Status — Data SSOT
 *
 * Project-scoped status numbers for /projects/upcycling/status. Edit
 * this file when the team meets to update progress before the Swico
 * Innovationsfonds presentation (planned 2026-07-03) and on each
 * milestone afterwards.
 *
 * Convention (mirrors src/data/impact-metrics.ts):
 *   - This file holds IDs, numbers, dates, statuses, and partner roles.
 *   - User-facing text (titles, labels, descriptions, units) lives in
 *     messages/<locale>.json under projects.upcycling.status.
 *
 * Why a project-scoped file (not the org-numbers SSOT)? These figures
 * are bound to the Monitor-Upcycling pilot specifically — they aren't
 * organisational defaults. Once the project graduates to a recurring
 * programme, promote them.
 *
 * Numbers below are interim estimates as of the snapshot date. The
 * definitive impact figures arrive with the ZHAW LCA report (Q3 2026);
 * until then the page renders the disclaimer string from i18n.
 */

export type MilestoneStatus = 'done' | 'active' | 'upcoming'

/** Stable per-milestone identifiers — must match the `key` field of the
 *  corresponding entry in messages.projects.upcycling.status.timeline.items. */
export type MilestoneKey =
  | 'kickoff'
  | 'prototype'
  | 'lca-start'
  | 'series'
  | 'swico'
  | 'lca-final'
  | 'scale'

export const UPCYCLING_STATUS = {
  /** ISO date of the snapshot — used for the "Stand: <date>" header. */
  snapshotIso: '2026-06-08',

  production: {
    /** Lamps physically built and quality-checked. */
    lampsBuilt: 12,
    /** Committed Kleinserie target (matches "30–70 Einheiten" pledge). */
    lampsTarget: 70,
    /** Monitor models with a published step-by-step guide. */
    modelsDocumented: 1,
    /** Pilot installations currently live in partner properties. */
    pilotsActive: 0,
    /** Monitors received from ERZ / partners and queued for production. */
    monitorsInIntake: 24,
  },

  /**
   * Interim impact figures. Each value is rounded to a no-false-precision
   * granularity (see [[pattern_co2_credibility]] in memory). The ZHAW LCA
   * report will replace these with verified numbers in Q3 2026.
   */
  impact: {
    eWasteAvoidedKg: 145,
    workshopHours: 86,
    co2SavedKg: 220,
    reuseRatePercent: 78,
  },

  /** Milestone statuses keyed by the same slug as the i18n timeline.items. */
  milestoneStatuses: {
    'kickoff':   'done',
    'prototype': 'done',
    'lca-start': 'done',
    'series':    'active',
    'swico':     'upcoming',
    'lca-final': 'upcoming',
    'scale':     'upcoming',
  } satisfies Record<MilestoneKey, MilestoneStatus>,
}
