/**
 * Report Status Constants (SSOT)
 * Used for marketplace listing reports and content reports.
 */

export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
} as const;

export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];

export const REPORT_STATUS_LABELS: Record<string, string> = {
  [REPORT_STATUS.PENDING]: 'Ausstehend',
  [REPORT_STATUS.REVIEWED]: 'Überprüft',
  [REPORT_STATUS.RESOLVED]: 'Gelöst',
  [REPORT_STATUS.ARCHIVED]: 'Archiviert',
};

export function getReportStatusLabel(status: string): string {
  return REPORT_STATUS_LABELS[status] || status;
}
