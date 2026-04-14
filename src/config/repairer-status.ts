/**
 * Repairer / technician profile status and tier constants — SSOT.
 */

export const REPAIRER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const

export type RepairerStatus = (typeof REPAIRER_STATUS)[keyof typeof REPAIRER_STATUS]

export const REPAIRER_STATUS_LABELS: Record<RepairerStatus, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  suspended: 'Gesperrt',
  pending: 'Ausstehend',
}

/**
 * Profile tier: distinguishes self-registered helpers from vetted professionals.
 */
export const REPAIRER_PROFILE_TIER = {
  COMMUNITY: 'community',       // self-registered via /profil/techniker
  PROFESSIONAL: 'professional', // vetted via repairer application flow
} as const;

export type RepairerProfileTier = typeof REPAIRER_PROFILE_TIER[keyof typeof REPAIRER_PROFILE_TIER];

export const REPAIRER_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type RepairerApplicationStatus =
  (typeof REPAIRER_APPLICATION_STATUS)[keyof typeof REPAIRER_APPLICATION_STATUS]

/**
 * Availability slot types for repairer_availability table.
 * CHECK (availability_type IN ('available', 'booked', 'blocked'))
 */
export const REPAIRER_AVAILABILITY_TYPE = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
} as const;

export type RepairerAvailabilityType = typeof REPAIRER_AVAILABILITY_TYPE[keyof typeof REPAIRER_AVAILABILITY_TYPE];

export const REPAIRER_APPLICATION_STATUS_LABELS: Record<RepairerApplicationStatus, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}
