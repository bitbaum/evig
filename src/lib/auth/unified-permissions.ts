/**
 * Unified Permission System for RevampIT
 *
 * **Purpose**: Bridge between old role-based and new permission-based auth systems
 * during migration period.
 *
 * **Problem Solved**: Prevents staff lockouts when migrating from:
 * - Old: role === 'REVAMPIT_ADMIN' (11 files)
 * - New: isStaff + staffPermissions (6 files)
 *
 * **Design**: Compatibility layer that checks BOTH systems
 * - Supports users with old role field
 * - Supports users with new is_staff + staff_permissions fields
 * - Zero breaking changes (additive only)
 *
 * **Migration Timeline**:
 * - Week 3: Deploy this layer (additive, no changes to existing code)
 * - Week 4-5: Migrate 11 files to use unified functions
 * - Week 6-7: Monitor and verify
 * - Week 8+: Keep compatibility layer indefinitely (minimal cost, zero risk)
 *
 * @see ARCHITECTURE_EVALUATION.md - Phase 2: Auth System Consolidation
 */

import { ROLES } from '@/lib/constants'
import {
  ADMIN_SECTIONS,
  type AdminSection,
  isSuperAdmin as newSystemIsSuperAdmin,
  isStaffEmail,
} from '@/lib/permissions'
import { logger } from '@/lib/logger'

// =============================================================================
// UNIFIED USER INTERFACE
// =============================================================================

/**
 * User interface supporting BOTH old and new auth systems
 *
 * During migration, users may have:
 * - Old system: role field (e.g., 'REVAMPIT_ADMIN')
 * - New system: is_staff + staff_permissions + is_super_admin
 * - Both: During transition period
 */
export interface UnifiedUser {
  // Required fields (common to both systems)
  email: string

  // Old system fields (role-based)
  role?: string

  // New system fields (permission-based)
  isStaff?: boolean
  is_staff?: boolean // Alternative field name (snake_case from DB)
  staffPermissions?: string[]
  staff_permissions?: string[] // Alternative field name (snake_case from DB)
  isSuperAdmin?: boolean
  is_super_admin?: boolean // Alternative field name (snake_case from DB)

  // Optional common fields
  id?: string
  name?: string | null
}

// =============================================================================
// CORE UNIFIED FUNCTIONS
// =============================================================================

/**
 * Check if user has admin access (ANY admin access)
 *
 * **Compatibility**: Checks BOTH old and new systems
 *
 * Returns true if user meets ANY of these criteria:
 * - Old system: role === 'REVAMPIT_ADMIN' (or other admin roles)
 * - New system: is_staff === true
 * - New system: is_super_admin === true
 * - Email: @revamp-it.ch domain (auto-staff)
 *
 * **Usage**:
 * ```typescript
 * if (!hasAdminAccessUnified(session.user)) {
 *   return NextResponse.redirect('/unauthorized')
 * }
 * ```
 *
 * @param user - User from session or database
 * @returns true if user has any admin access
 */
export function hasAdminAccessUnified(user: UnifiedUser | null | undefined): boolean {
  if (!user) {
    logger.debug('hasAdminAccessUnified: No user provided')
    return false
  }

  // Check new system first (preferred)
  const isStaff = user.isStaff ?? user.is_staff ?? false
  const isSuperAdmin = user.isSuperAdmin ?? user.is_super_admin ?? false

  if (isStaff || isSuperAdmin) {
    logger.debug('hasAdminAccessUnified: Granted via new system', {
      email: user.email,
      isStaff,
      isSuperAdmin,
    })
    return true
  }

  // Check email domain (new system fallback)
  if (isStaffEmail(user.email)) {
    logger.debug('hasAdminAccessUnified: Granted via email domain', {
      email: user.email,
    })
    return true
  }

  // Check old system (for backwards compatibility)
  if (user.role) {
    const hasOldRoleAccess = ([
      ROLES.REVAMPIT_SUPER_ADMIN,
      ROLES.REVAMPIT_ADMIN,
      ROLES.REVAMPIT_EDITOR,
      ROLES.REVAMPIT_SUPPORT,
      ROLES.HIRN_ADMIN,
      ROLES.HIRN_USER,
      ROLES.MODERATOR,
    ] as readonly string[]).includes(user.role ?? '')

    if (hasOldRoleAccess) {
      logger.debug('hasAdminAccessUnified: Granted via old role system', {
        email: user.email,
        role: user.role,
      })
      return true
    }
  }

  logger.debug('hasAdminAccessUnified: Access denied', {
    email: user.email,
    role: user.role,
    isStaff,
  })
  return false
}

/**
 * Check if user can access a specific admin section
 *
 * **Compatibility**: Checks BOTH old and new systems
 *
 * Access granted if user meets ANY of these criteria:
 * - Super admin (old or new system)
 * - New system: has wildcard permission ('*')
 * - New system: has specific section permission
 * - Old system: has admin role (gets access to all sections)
 *
 * **Usage**:
 * ```typescript
 * if (!canAccessSectionUnified(session.user, 'users')) {
 *   return apiError(null, 'Unauthorized', 403)
 * }
 * ```
 *
 * @param user - User from session or database
 * @param section - Admin section key (e.g., 'dashboard', 'users')
 * @returns true if user can access the section
 */
export function canAccessSectionUnified(
  user: UnifiedUser | null | undefined,
  section: AdminSection
): boolean {
  if (!user) {
    logger.debug('canAccessSectionUnified: No user provided', { section })
    return false
  }

  // Super admin (new or old) always has access
  const isSuperAdmin = user.isSuperAdmin ?? user.is_super_admin ?? false
  if (isSuperAdmin || newSystemIsSuperAdmin(user.email, isSuperAdmin)) {
    logger.debug('canAccessSectionUnified: Granted via super admin', {
      email: user.email,
      section,
    })
    return true
  }

  // Old system: REVAMPIT_SUPER_ADMIN and REVAMPIT_ADMIN get access to all sections
  if (
    user.role === ROLES.REVAMPIT_SUPER_ADMIN ||
    user.role === ROLES.REVAMPIT_ADMIN
  ) {
    logger.debug('canAccessSectionUnified: Granted via old admin role', {
      email: user.email,
      role: user.role,
      section,
    })
    return true
  }

  // New system: Check staff permissions
  const isStaff = user.isStaff ?? user.is_staff ?? false
  if (isStaff) {
    const permissions =
      user.staffPermissions ?? user.staff_permissions ?? []

    // Wildcard permission = full access
    if (permissions.includes('*')) {
      logger.debug('canAccessSectionUnified: Granted via wildcard permission', {
        email: user.email,
        section,
      })
      return true
    }

    // Check specific permission
    if (permissions.includes(section)) {
      logger.debug('canAccessSectionUnified: Granted via specific permission', {
        email: user.email,
        section,
        permissions,
      })
      return true
    }
  }

  // Old system: Check role-specific access for certain sections
  if (user.role) {
    const sectionConfig = ADMIN_SECTIONS[section]

    // Non-sensitive sections accessible to editors and support
    if (!sectionConfig.sensitive) {
      if (
        user.role === ROLES.REVAMPIT_EDITOR &&
        ['dashboard', 'products', 'workshops-admin', 'services', 'content', 'approvals'].includes(section)
      ) {
        logger.debug('canAccessSectionUnified: Granted via editor role', {
          email: user.email,
          role: user.role,
          section,
        })
        return true
      }

      if (
        user.role === ROLES.REVAMPIT_SUPPORT &&
        ['dashboard', 'approvals', 'reviews'].includes(section)
      ) {
        logger.debug('canAccessSectionUnified: Granted via support role', {
          email: user.email,
          role: user.role,
          section,
        })
        return true
      }
    }

    // Hirn sections for Hirn roles
    if (section === 'hirn' || section === 'finances') {
      if (user.role === ROLES.HIRN_ADMIN || user.role === ROLES.HIRN_USER) {
        logger.debug('canAccessSectionUnified: Granted via Hirn role', {
          email: user.email,
          role: user.role,
          section,
        })
        return true
      }
    }
  }

  logger.debug('canAccessSectionUnified: Access denied', {
    email: user.email,
    section,
    role: user.role,
    isStaff,
    permissions: user.staffPermissions ?? user.staff_permissions,
  })
  return false
}

/**
 * Get all sections a user can access
 *
 * **Compatibility**: Works with BOTH old and new systems
 *
 * @param user - User from session or database
 * @returns Array of section keys user can access
 */
export function getAccessibleSectionsUnified(
  user: UnifiedUser | null | undefined
): AdminSection[] {
  if (!user) return []

  const sections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
  return sections.filter((section) => canAccessSectionUnified(user, section))
}

/**
 * Check if user is super admin (old or new system)
 *
 * @param user - User from session or database
 * @returns true if user is a super admin
 */
export function isSuperAdminUnified(
  user: UnifiedUser | null | undefined
): boolean {
  if (!user) return false

  // Check new system
  const isSuperAdmin = user.isSuperAdmin ?? user.is_super_admin ?? false
  if (isSuperAdmin || newSystemIsSuperAdmin(user.email, isSuperAdmin)) {
    return true
  }

  // Check old system
  return user.role === ROLES.REVAMPIT_SUPER_ADMIN
}

/**
 * Check if user is staff (old or new system)
 *
 * @param user - User from session or database
 * @returns true if user is staff
 */
export function isStaffUnified(
  user: UnifiedUser | null | undefined
): boolean {
  if (!user) return false

  // Check new system
  const isStaff = user.isStaff ?? user.is_staff ?? false
  if (isStaff) return true

  // Check email domain
  if (isStaffEmail(user.email)) return true

  // Check old system
  return ([
    ROLES.REVAMPIT_SUPER_ADMIN,
    ROLES.REVAMPIT_ADMIN,
    ROLES.REVAMPIT_EDITOR,
    ROLES.REVAMPIT_SUPPORT,
  ] as readonly string[]).includes(user.role ?? '')
}

// =============================================================================
// MIGRATION HELPER FUNCTIONS
// =============================================================================

/**
 * Convert old role to new permissions
 *
 * Useful for migration scripts that need to convert users from old to new system.
 *
 * @param role - Old role string
 * @returns Object with is_staff, staff_permissions, is_super_admin
 */
export function convertRoleToPermissions(role: string): {
  is_staff: boolean
  staff_permissions: string[]
  is_super_admin: boolean
} {
  switch (role) {
    case ROLES.REVAMPIT_SUPER_ADMIN:
      return {
        is_staff: true,
        staff_permissions: ['*'],
        is_super_admin: true,
      }

    case ROLES.REVAMPIT_ADMIN:
      return {
        is_staff: true,
        staff_permissions: ['*'],
        is_super_admin: false,
      }

    case ROLES.REVAMPIT_EDITOR:
      return {
        is_staff: true,
        staff_permissions: [
          'dashboard',
          'products',
          'workshops-admin',
          'services',
          'content',
          'approvals',
        ],
        is_super_admin: false,
      }

    case ROLES.REVAMPIT_SUPPORT:
      return {
        is_staff: true,
        staff_permissions: ['dashboard', 'approvals', 'reviews'],
        is_super_admin: false,
      }

    case ROLES.HIRN_ADMIN:
      return {
        is_staff: true,
        staff_permissions: ['dashboard', 'hirn', 'finances', 'analytics'],
        is_super_admin: false,
      }

    case ROLES.HIRN_USER:
      return {
        is_staff: true,
        staff_permissions: ['dashboard', 'hirn', 'analytics'],
        is_super_admin: false,
      }

    case ROLES.MODERATOR:
      return {
        is_staff: true,
        staff_permissions: ['dashboard', 'approvals', 'reviews', 'content'],
        is_super_admin: false,
      }

    default:
      // Non-staff roles
      return {
        is_staff: false,
        staff_permissions: [],
        is_super_admin: false,
      }
  }
}

/**
 * Check if user needs migration from old to new system
 *
 * @param user - User from database
 * @returns true if user has old role but no new permissions
 */
export function needsMigration(user: UnifiedUser): boolean {
  const hasOldRole = !!user.role
  const hasNewPermissions = (user.isStaff ?? user.is_staff) !== undefined

  return hasOldRole && !hasNewPermissions
}
