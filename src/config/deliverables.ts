/**
 * Deliverables Configuration — SINGLE SOURCE OF TRUTH
 *
 * All deliverable/feedback enums, labels and badge colours live here. This
 * config + zod at the write boundary is the ONLY enum authority — the DB
 * columns are plain TEXT with no CHECK constraint (per CLAUDE.md §DB). Adding a
 * type/status needs no migration.
 *
 * Mirrors the shape of src/config/tasks.ts.
 */

// ---- Deliverable type -------------------------------------------------------

export const DELIVERABLE_TYPES = {
  REPORT: 'report',
  PRESENTATION: 'presentation',
  MOCKUP: 'mockup',
  DOCUMENT: 'document',
  LINK: 'link',
  OTHER: 'other',
} as const

export type DeliverableType = (typeof DELIVERABLE_TYPES)[keyof typeof DELIVERABLE_TYPES]

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  report: 'Bericht',
  presentation: 'Präsentation',
  mockup: 'Mockup',
  document: 'Dokument',
  link: 'Link',
  other: 'Sonstiges',
}

// ---- Deliverable status (review lifecycle) ----------------------------------

export const DELIVERABLE_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  REVISING: 'revising',
  APPROVED: 'approved',
} as const

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[keyof typeof DELIVERABLE_STATUSES]

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  draft: 'Entwurf',
  in_review: 'In Prüfung',
  revising: 'In Überarbeitung',
  approved: 'Freigegeben',
}

export const DELIVERABLE_STATUS_COLORS: Record<DeliverableStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-800',
  in_review: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200',
  revising: 'bg-orange-100 text-orange-800',
  approved: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
}

// ---- Visibility -------------------------------------------------------------

export const DELIVERABLE_VISIBILITY = {
  TEAM: 'team',
  PUBLIC: 'public',
} as const

export type DeliverableVisibility = (typeof DELIVERABLE_VISIBILITY)[keyof typeof DELIVERABLE_VISIBILITY]

export const DELIVERABLE_VISIBILITY_LABELS: Record<DeliverableVisibility, string> = {
  team: 'Team',
  public: 'Öffentlich',
}

// ---- Feedback kind ----------------------------------------------------------

export const FEEDBACK_KINDS = {
  COMMENT: 'comment',
  CHANGE_REQUEST: 'change_request',
  APPROVAL: 'approval',
} as const

export type FeedbackKind = (typeof FEEDBACK_KINDS)[keyof typeof FEEDBACK_KINDS]

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  comment: 'Kommentar',
  change_request: 'Änderungswunsch',
  approval: 'Freigabe',
}

export const FEEDBACK_KIND_COLORS: Record<FeedbackKind, string> = {
  comment: 'bg-neutral-100 text-neutral-800',
  change_request: 'bg-orange-100 text-orange-800',
  approval: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
}

// ---- Feedback status (change_request lifecycle) -----------------------------

export const FEEDBACK_STATUSES = {
  OPEN: 'open',
  ADDRESSED: 'addressed',
  WONTFIX: 'wontfix',
  APPROVED: 'approved',
} as const

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[keyof typeof FEEDBACK_STATUSES]

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Offen',
  addressed: 'Erledigt',
  wontfix: 'Verworfen',
  approved: 'Freigegeben',
}

export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  open: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200',
  addressed: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
  wontfix: 'bg-neutral-100 text-neutral-800',
  approved: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
}

// ---- Files ------------------------------------------------------------------

/** Extensions we can render inline as code / read as text for RAG grounding. */
export const TEXT_FILE_EXTENSIONS = [
  'html', 'htm', 'css', 'js', 'ts', 'tsx', 'jsx', 'json', 'md', 'txt', 'csv', 'svg', 'xml', 'yml', 'yaml',
] as const

export function isTextFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return (TEXT_FILE_EXTENSIONS as readonly string[]).includes(ext)
}
