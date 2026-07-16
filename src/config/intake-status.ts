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

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  in_progress: 'In Bearbeitung',
  failed: 'Prüfung fehlgeschlagen',
  ready: 'Bereit',
  published: 'Veröffentlicht',
};
