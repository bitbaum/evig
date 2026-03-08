/**
 * Intake/Inventory Status Constants (SSOT)
 * Used for intake pipeline and inventory management.
 */

export const INTAKE_STATUS = {
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  PUBLISHED: 'published',
} as const;

export type IntakeStatus = typeof INTAKE_STATUS[keyof typeof INTAKE_STATUS];

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  in_progress: 'In Bearbeitung',
  ready: 'Bereit',
  published: 'Veröffentlicht',
};
