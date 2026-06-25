/**
 * RevampIT Simplified Permission System
 *
 * This replaces the complex 15+ role system with a simple approach:
 * - Regular users: No roles, just create content that needs approval
 * - Staff (@revamp-it.ch): Access to admin with granular permissions
 *
 * SSOT: Section definitions come from @/config/sections.ts
 * KISS, DRY principles applied.
 *
 * Last Updated: 2026-01-26
 */

import {
  SECTIONS,
  ADMIN_SECTION_IDS,
  SENSITIVE_SECTION_IDS,
  getAdminSections,
  isSensitiveSection as checkSensitive,
  type SectionConfig,
} from '@/config/sections'

// =============================================================================
// ADMIN SECTIONS - Derived from SSOT (sections.ts)
// =============================================================================

/**
 * Admin sections derived from unified SSOT
 * This replaces the manually defined ADMIN_SECTIONS
 */
export const ADMIN_SECTIONS = Object.fromEntries(
  getAdminSections().map(section => [
    section.id,
    {
      label: section.ui.label,
      path: section.path,
      sensitive: section.visibility.sensitive ?? false,
      description: section.ui.description,
    },
  ])
) as Record<
  string,
  { label: string; path: string; sensitive: boolean; description: string }
>

export type AdminSection = (typeof ADMIN_SECTION_IDS)[number]

// =============================================================================
// STAFF EMAIL DOMAIN
// =============================================================================

export const STAFF_EMAIL_DOMAIN = 'revamp-it.ch'
export const LEGACY_STAFF_EMAIL_DOMAINS = ['revampit.ch'] as const

/**
 * Check if an email belongs to staff
 */
export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.toLowerCase()
  return (
    normalized.endsWith(`@${STAFF_EMAIL_DOMAIN}`) ||
    LEGACY_STAFF_EMAIL_DOMAINS.some(domain => normalized.endsWith(`@${domain}`))
  )
}

// =============================================================================
// SUPER ADMINS - Full access to everything including sensitive sections
// =============================================================================

/**
 * Super admins have full access to all sections including sensitive ones.
 * This is a simple allowlist of email addresses.
 */
export const SUPER_ADMIN_EMAILS = [
  'andreas@revamp-it.ch',
  'veronica@revamp-it.ch',
  'daniel@revamp-it.ch',
  'georgy@revamp-it.ch',
  'georgy.butaev@revamp-it.ch',
] as const

/**
 * Check if a user is a super admin
 * Can be determined by:
 * 1. Email being in the hardcoded SUPER_ADMIN_EMAILS list
 * 2. is_super_admin flag from session/database
 */
export function isSuperAdmin(
  email: string | null | undefined,
  isSuperAdminFromDb?: boolean
): boolean {
  if (isSuperAdminFromDb === true) return true
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(
    email.toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number]
  )
}

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

export interface StaffUser {
  email: string
  is_staff: boolean
  staff_permissions: string[] // Array of section keys, or ['*'] for all
  is_super_admin?: boolean // From database/session
}

/**
 * Permission aliases for backwards compatibility
 * Maps old permission names to new ones
 */
const PERMISSION_ALIASES: Record<string, string> = {
  finances: 'finanzen',
  'workshops-admin': 'workshops',
  'it-hilfe': 'it-hilfe-admin',
  services: 'appointments-admin',
}

/**
 * Check if a user can access a specific admin section
 */
export function canAccessSection(
  user: StaffUser | null | undefined,
  section: string
): boolean {
  if (!user) return false
  if (!user.is_staff) return false

  // Super admins always have full access
  if (isSuperAdmin(user.email, user.is_super_admin)) return true

  // Wildcard permission = full access
  if (user.staff_permissions.includes('*')) return true

  // Check specific permission (with alias support)
  if (user.staff_permissions.includes(section)) return true

  // Check alias
  const alias = PERMISSION_ALIASES[section]
  if (alias && user.staff_permissions.includes(alias)) return true

  // Check reverse alias (if user has old permission, grant access to new section)
  const reverseAlias = Object.entries(PERMISSION_ALIASES).find(([, v]) => v === section)
  if (reverseAlias && user.staff_permissions.includes(reverseAlias[0])) return true

  return false
}

/**
 * Check if a user can access any sensitive section
 */
export function canAccessSensitive(user: StaffUser | null | undefined): boolean {
  if (!user) return false
  if (!user.is_staff) return false
  if (isSuperAdmin(user.email, user.is_super_admin)) return true
  if (user.staff_permissions.includes('*')) return true

  // Check if they have permission for any sensitive section
  return SENSITIVE_SECTION_IDS.some(section =>
    user.staff_permissions.includes(section)
  )
}

/**
 * Convert a session user (camelCase) to StaffUser (snake_case)
 * Used by middleware to bridge session shape to permission checks.
 */
export function toStaffUser(sessionUser: {
  email: string
  isStaff: boolean
  staffPermissions: string[]
  isSuperAdmin?: boolean
}): StaffUser {
  return {
    email: sessionUser.email,
    is_staff: sessionUser.isStaff,
    staff_permissions: sessionUser.staffPermissions,
    is_super_admin: sessionUser.isSuperAdmin,
  }
}

/**
 * Get all sections a user can access
 */
export function getAccessibleSections(
  user: StaffUser | null | undefined
): string[] {
  if (!user || !user.is_staff) return []

  // Super admins or wildcard = all sections
  if (isSuperAdmin(user.email, user.is_super_admin) || user.staff_permissions.includes('*')) {
    return ADMIN_SECTION_IDS
  }

  // Filter to permitted sections, checking aliases for backward compat
  return ADMIN_SECTION_IDS.filter(sectionId => {
    if (user.staff_permissions.includes(sectionId)) return true
    const aliasedPerm = PERMISSION_ALIASES[sectionId]
    return !!(aliasedPerm && user.staff_permissions.includes(aliasedPerm))
  })
}

/**
 * Check if a section is sensitive (derived from SSOT)
 */
export function isSensitiveSection(section: string): boolean {
  return checkSensitive(section)
}

// =============================================================================
// DEFAULT PERMISSIONS FOR NEW STAFF
// =============================================================================

/**
 * Default permissions for new staff members (non-super-admins)
 * They get access to non-sensitive sections by default
 */
export const DEFAULT_STAFF_PERMISSIONS: string[] = ADMIN_SECTION_IDS.filter(
  id => !SENSITIVE_SECTION_IDS.includes(id)
)

/**
 * Get initial permissions for a new staff member
 */
export function getInitialStaffPermissions(email: string): string[] {
  if (isSuperAdmin(email)) {
    return ['*'] // Full access
  }
  return [...DEFAULT_STAFF_PERMISSIONS]
}

// =============================================================================
// CONTENT APPROVAL STATUS
// =============================================================================

/**
 * Status for user-submitted content (products, services, workshops, blog posts)
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft', // User is still editing
  PENDING: 'pending', // Submitted for review
  APPROVED: 'approved', // Approved and visible
  REJECTED: 'rejected', // Rejected with reason
  ARCHIVED: 'archived', // No longer active
} as const

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS]

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Map old role strings to new system for migration
 * This helps during the transition period
 */
export function migrateOldRole(oldRole: string | null | undefined): {
  is_staff: boolean
  staff_permissions: string[]
} {
  if (!oldRole) {
    return { is_staff: false, staff_permissions: [] }
  }

  // Map old roles to new system
  const roleMapping: Record<
    string,
    { is_staff: boolean; staff_permissions: string[] }
  > = {
    revampit_super_admin: { is_staff: true, staff_permissions: ['*'] },
    revampit_admin: { is_staff: true, staff_permissions: ['*'] },
    admin: { is_staff: true, staff_permissions: ['*'] },
    revampit_editor: {
      is_staff: true,
      staff_permissions: ['dashboard', 'content', 'products', 'workshops-admin'],
    },
    revampit_support: {
      is_staff: true,
      staff_permissions: ['dashboard', 'users', 'reviews'],
    },
    hirn_admin: {
      is_staff: true,
      staff_permissions: ['dashboard', 'hirn', 'finances', 'analytics'],
    },
    hirn_user: {
      is_staff: true,
      staff_permissions: ['dashboard', 'hirn', 'analytics'],
    },
  }

  return roleMapping[oldRole] || { is_staff: false, staff_permissions: [] }
}

// =============================================================================
// RE-EXPORTS FROM SSOT
// =============================================================================

export {
  SECTIONS,
  ADMIN_SECTION_IDS,
  SENSITIVE_SECTION_IDS,
  getAdminSections,
  getDashboardSections,
  getSection,
  getSectionsByCategory,
  CATEGORIES,
  getSortedCategories,
} from '@/config/sections'

export type { SectionConfig, SectionCategory, SectionColor } from '@/config/sections'

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { AdminSection as AdminSectionType }
