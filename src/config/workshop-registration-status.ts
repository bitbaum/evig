/**
 * Workshop Registration Status Constants (SSOT)
 */

export const WORKSHOP_REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  WAITLIST: 'waitlist',
  ATTENDED: 'attended',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type WorkshopRegistrationStatus = typeof WORKSHOP_REGISTRATION_STATUS[keyof typeof WORKSHOP_REGISTRATION_STATUS];

export const WORKSHOP_REGISTRATION_STATUS_LABELS: Record<string, string> = {
  [WORKSHOP_REGISTRATION_STATUS.PENDING]: 'Ausstehend',
  [WORKSHOP_REGISTRATION_STATUS.CONFIRMED]: 'Bestätigt',
  [WORKSHOP_REGISTRATION_STATUS.WAITLIST]: 'Warteliste',
  [WORKSHOP_REGISTRATION_STATUS.ATTENDED]: 'Teilgenommen',
  [WORKSHOP_REGISTRATION_STATUS.CANCELLED]: 'Storniert',
  [WORKSHOP_REGISTRATION_STATUS.NO_SHOW]: 'Nicht erschienen',
};

export function getWorkshopRegistrationStatusLabel(status: string): string {
  return WORKSHOP_REGISTRATION_STATUS_LABELS[status] || status;
}
