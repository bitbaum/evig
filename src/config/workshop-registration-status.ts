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

export const WORKSHOP_REGISTRATION_STATUS_VALUES = Object.values(WORKSHOP_REGISTRATION_STATUS) as [WorkshopRegistrationStatus, ...WorkshopRegistrationStatus[]];

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

/**
 * Workshop registration payment status constants (SSOT).
 * Separate from the main registration status — tracks only the payment dimension.
 */
export const WORKSHOP_PAYMENT_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export type WorkshopPaymentStatus = typeof WORKSHOP_PAYMENT_STATUS[keyof typeof WORKSHOP_PAYMENT_STATUS];

/**
 * Workshop material access type constants (SSOT).
 * Determines which registrants can view a given material.
 */
export const WORKSHOP_MATERIAL_ACCESS_TYPE = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  ATTENDED: 'attended',
} as const;

export type WorkshopMaterialAccessType = typeof WORKSHOP_MATERIAL_ACCESS_TYPE[keyof typeof WORKSHOP_MATERIAL_ACCESS_TYPE];
