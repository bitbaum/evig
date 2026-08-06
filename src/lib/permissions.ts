/**
 * evig Simplified Permission System
 *
 * This replaces the complex 15+ role system with a simple approach:
 * - Regular users: No roles, just create content that needs approval
 * - Staff: `is_staff` in the DB, granted explicitly by a super admin
 *   (PATCH /api/admin/users/[id]/permissions) or the HR hire flow.
 *
 * Staff status is NEVER derived from the e-mail domain. Anyone may register;
 * a super admin decides who becomes staff. `isStaffEmail` below is cosmetic
 * only (it picks which welcome-email copy to send) — see `src/auth.ts`.
 *
 * SSOT: Section definitions come from @/config/sections.ts
 * KISS, DRY principles applied.
 *
 * Last Updated: 2026-08-05
 */

import { ORG } from '@/config/org'
import {
  SECTIONS,
  ADMIN_SECTION_IDS,
  SENSITIVE_SECTION_IDS,
  STAFF_UNIVERSAL_SECTION_IDS,
  getAdminSections,
  isSensitiveSection as checkSensitive,
  type SectionConfig,
  type SectionId,
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

export type AdminSection = SectionId

// =============================================================================
// STAFF EMAIL DOMAIN
// =============================================================================

/**
 * evig's own mail domain (SSOT: org.ts). Layer B — the legacy Revamp-IT
 * domains stay listed until the infra cutover, because existing accounts
 * (including the owner's) still log in with them.
 */
export const STAFF_EMAIL_DOMAIN = ORG.emailDomain
export const LEGACY_STAFF_EMAIL_DOMAINS = ['revamp-it.ch', 'revampit.ch'] as const

/**
 * COSMETIC ONLY — picks the welcome-email template at registration.
 * This grants NOTHING. Staff access comes from the `is_staff` DB column,
 * set by a super admin. Never use this as an authorization check.
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
 * BOOTSTRAP ALLOWLIST — the owner, so the platform can never be locked out
 * of its own admin (e.g. if `is_super_admin` is cleared by a bad migration).
 *
 * The DATABASE (`users.is_super_admin`) is the SSOT for super-admin status;
 * this list is a floor, not the roster. Grant super admin to anyone else via
 * PATCH /api/admin/users/[id]/permissions — never by editing this array.
 *
 * evig separated from Revamp-IT on 2026-07-24. The Revamp-IT super admins
 * (andreas@, veronica@, daniel@) were removed on 2026-08-05: they held full
 * access to evig's sensitive sections (users, finances, settings) purely by
 * e-mail, bypassing the DB — and the demotion guard below made them
 * un-removable through the UI.
 *
 * Layer B: the owner's login is still `@revamp-it.ch` (see .claude/CLAUDE.md).
 * Add the evig address here at infra cutover, do not swap it before.
 */
export const SUPER_ADMIN_EMAILS = ['georgy.butaev@revamp-it.ch'] as const

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
 * Permission aliases: section id → permission string that also grants it
 * (checked in both directions). Every KEY must be an existing section id in
 * @/config/sections.ts — pure legacy rename leftovers were removed when the
 * legacy admin pages were cleaned up (no prod user held a legacy string).
 */
const PERMISSION_ALIASES: Partial<Record<AdminSection, string>> = {
  'workshops-admin': 'workshops',
  services: 'appointments-admin',
  'hr-vacancies': 'team',
  'hr-applications': 'team',
  erfassung: 'intake',
  // `products` is the hidden API permission used by the advanced product
  // editor. Staff who can operate the device pipeline must be able to use
  // that editor too; otherwise the visible intake flow leads to 403s.
  products: 'intake',
  'analyse-hub': 'finanzen',
}

/**
 * Check if a user can access a specific admin section
 */
export function canAccessSection(
  user: StaffUser | null | undefined,
  section: AdminSection
): boolean {
  if (!user) return false

  // Super admins always have full access — checked BEFORE the is_staff gate so
  // that a cleared `is_staff` flag can never lock the owner out of admin.
  if (isSuperAdmin(user.email, user.is_super_admin)) return true

  if (!user.is_staff) return false

  // Personal staff tools (own Zeiterfassung, …) are open to every staff
  // member — permission narrowing never removes someone's own tools.
  if (STAFF_UNIVERSAL_SECTION_IDS.includes(section)) return true

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

  // Analyse hub is also reachable for Hirn-only staff (matches requireAnySection on /admin/analyse)
  if (section === 'analyse-hub' && user.staff_permissions.includes('hirn')) return true

  return false
}

/**
 * Check if a user can access any sensitive section
 */
export function canAccessSensitive(user: StaffUser | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user.email, user.is_super_admin)) return true
  if (!user.is_staff) return false
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
): AdminSection[] {
  if (!user) return []

  // Super admins or wildcard = all sections. Super admin is checked before the
  // is_staff gate for the same lockout reason as canAccessSection.
  if (isSuperAdmin(user.email, user.is_super_admin)) return ADMIN_SECTION_IDS
  if (!user.is_staff) return []
  if (user.staff_permissions.includes('*')) return ADMIN_SECTION_IDS

  // Filter to permitted sections, checking aliases for backward compat.
  // Personal staff tools (alwaysForStaff) are included for every staff member.
  return ADMIN_SECTION_IDS.filter(sectionId => {
    if (STAFF_UNIVERSAL_SECTION_IDS.includes(sectionId)) return true
    if (user.staff_permissions.includes(sectionId)) return true
    const aliasedPerm = PERMISSION_ALIASES[sectionId]
    return !!(aliasedPerm && user.staff_permissions.includes(aliasedPerm))
  })
}

/**
 * Check if a section is sensitive (derived from SSOT)
 */
export function isSensitiveSection(section: AdminSection): boolean {
  return checkSensitive(section)
}

// =============================================================================
// DEFAULT PERMISSIONS FOR NEW STAFF
// =============================================================================

/**
 * Default permissions for new staff members (non-super-admins)
 * They get access to non-sensitive sections by default
 */
export const DEFAULT_STAFF_PERMISSIONS: AdminSection[] = ADMIN_SECTION_IDS.filter(
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
