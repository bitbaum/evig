/**
 * Registration Configuration - Single Source of Truth
 *
 * Defines the roles available during user registration.
 * Used by auth schemas to validate registration role selection.
 *
 * @see src/lib/schemas/auth.ts - Uses these for Zod schema validation
 */

/**
 * Roles available for selection during registration
 * Note: This is a tuple type for Zod enum compatibility
 */
export const REGISTRATION_ROLES = ['customer', 'seller', 'repairer'] as const

export type RegistrationRole = (typeof REGISTRATION_ROLES)[number]

/**
 * Registration role labels (Swiss German)
 */
export const REGISTRATION_ROLE_LABELS: Record<RegistrationRole, string> = {
  customer: 'Kunde',
  seller: 'Verkäufer',
  repairer: 'Techniker',
}

/**
 * Registration role descriptions (Swiss German)
 */
export const REGISTRATION_ROLE_DESCRIPTIONS: Record<RegistrationRole, string> = {
  customer: 'Kaufe refurbished Produkte und buche Reparaturen',
  seller: 'Verkaufe deine eigenen refurbished Produkte',
  repairer: 'Biete IT-Dienstleistungen und Reparaturen an',
}
