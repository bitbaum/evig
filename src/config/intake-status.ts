/**
 * Intake/Inventory Status Constants (SSOT)
 * Used for intake pipeline and inventory management.
 */

export const INTAKE_STATUS = {
  IN_PROGRESS: 'in_progress',
  /** A required checklist item has a 'fail' verdict — fix & retest, or re-tier. */
  FAILED: 'failed',
  READY: 'ready',
  PUBLISHED: 'published',
} as const;

export type IntakeStatus = typeof INTAKE_STATUS[keyof typeof INTAKE_STATUS];

/**
 * Minimum pipeline fields needed to derive an item's operational stage.
 * Keep client views on the same precedence as the intake API:
 * published > failed > ready > in progress.
 */
export interface IntakeStatusSource {
  marketplace_status: string
  checklist_failed: boolean
  checklist_complete: boolean
}

export function getIntakeStatus(item: IntakeStatusSource): IntakeStatus {
  if (item.marketplace_status === INTAKE_STATUS.PUBLISHED) return INTAKE_STATUS.PUBLISHED
  if (item.checklist_failed) return INTAKE_STATUS.FAILED
  if (item.checklist_complete) return INTAKE_STATUS.READY
  return INTAKE_STATUS.IN_PROGRESS
}

/** Devices older than this need a visible age signal on the workshop board. */
export const INTAKE_STUCK_AFTER_DAYS = 3

export function getIntakeAgeDays(createdAt: string, now = new Date()): number {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 0
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000))
}

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  in_progress: 'In Bearbeitung',
  failed: 'Prüfung fehlgeschlagen',
  ready: 'Bereit',
  published: 'Veröffentlicht',
};
