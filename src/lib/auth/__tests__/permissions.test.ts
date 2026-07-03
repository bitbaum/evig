/**
 * Tests for permissions.ts
 *
 * Tests staff email detection, super admin checks, section access control,
 * and permission aliases.
 */

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
    }),
  },
}))

import {
  isStaffEmail,
  isSuperAdmin,
  canAccessSection,
  canAccessSensitive,
  getAccessibleSections,
  isSensitiveSection,
  getInitialStaffPermissions,
  STAFF_EMAIL_DOMAIN,
  SUPER_ADMIN_EMAILS,
  ADMIN_SECTIONS,
  DEFAULT_STAFF_PERMISSIONS,
  CONTENT_STATUS,
  ADMIN_SECTION_IDS,
  SENSITIVE_SECTION_IDS,
} from '@/lib/permissions'
import type { StaffUser } from '@/lib/permissions'

// ============================================================================
// isStaffEmail
// ============================================================================

describe('isStaffEmail', () => {
  it('returns true for @revamp-it.ch emails', () => {
    expect(isStaffEmail('user@revamp-it.ch')).toBe(true)
    expect(isStaffEmail('andreas@revamp-it.ch')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isStaffEmail('USER@REVAMP-IT.CH')).toBe(true)
    expect(isStaffEmail('User@Revamp-It.Ch')).toBe(true)
  })

  it('accepts the legacy seed admin domain', () => {
    expect(isStaffEmail('admin@revampit.ch')).toBe(true)
  })

  it('returns false for non-staff emails', () => {
    expect(isStaffEmail('user@gmail.com')).toBe(false)
    expect(isStaffEmail('user@revamp-it.com')).toBe(false)
    expect(isStaffEmail('user@notrevamp-it.ch')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isStaffEmail(null)).toBe(false)
    expect(isStaffEmail(undefined)).toBe(false)
    expect(isStaffEmail('')).toBe(false)
  })
})

// ============================================================================
// isSuperAdmin
// ============================================================================

describe('isSuperAdmin', () => {
  it('returns true for known super admin emails', () => {
    expect(isSuperAdmin('andreas@revamp-it.ch')).toBe(true)
    expect(isSuperAdmin('georgy@revamp-it.ch')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isSuperAdmin('ANDREAS@REVAMP-IT.CH')).toBe(true)
  })

  it('returns true when isSuperAdminFromDb flag is true', () => {
    expect(isSuperAdmin('random@example.com', true)).toBe(true)
  })

  it('returns false for non-super-admin staff', () => {
    expect(isSuperAdmin('newstaff@revamp-it.ch')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isSuperAdmin(null)).toBe(false)
    expect(isSuperAdmin(undefined)).toBe(false)
  })
})

// ============================================================================
// canAccessSection
// ============================================================================

describe('canAccessSection', () => {
  const superAdmin: StaffUser = {
    email: 'andreas@revamp-it.ch',
    is_staff: true,
    staff_permissions: ['dashboard'],
  }

  const regularStaff: StaffUser = {
    email: 'staff@revamp-it.ch',
    is_staff: true,
    staff_permissions: ['dashboard', 'products', 'workshops'],
  }

  const wildcardStaff: StaffUser = {
    email: 'wildcard@revamp-it.ch',
    is_staff: true,
    staff_permissions: ['*'],
  }

  const nonStaff: StaffUser = {
    email: 'user@gmail.com',
    is_staff: false,
    staff_permissions: [],
  }

  it('grants super admin access to any section', () => {
    expect(canAccessSection(superAdmin, 'dashboard')).toBe(true)
    expect(canAccessSection(superAdmin, 'hirn')).toBe(true)
    expect(canAccessSection(superAdmin, 'users')).toBe(true)
  })

  it('grants wildcard staff access to any section', () => {
    expect(canAccessSection(wildcardStaff, 'dashboard')).toBe(true)
    expect(canAccessSection(wildcardStaff, 'hirn')).toBe(true)
  })

  it('grants access to explicitly permitted sections', () => {
    expect(canAccessSection(regularStaff, 'dashboard')).toBe(true)
    expect(canAccessSection(regularStaff, 'products')).toBe(true)
  })

  it('denies access to unpermitted sections', () => {
    expect(canAccessSection(regularStaff, 'hirn')).toBe(false)
    expect(canAccessSection(regularStaff, 'users')).toBe(false)
  })

  it('denies access for non-staff users', () => {
    expect(canAccessSection(nonStaff, 'dashboard')).toBe(false)
  })

  it('denies access for null/undefined user', () => {
    expect(canAccessSection(null, 'dashboard')).toBe(false)
    expect(canAccessSection(undefined, 'dashboard')).toBe(false)
  })

  it('supports permission aliases (erfassung ← intake)', () => {
    const staffWithIntake: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['intake'],
    }
    expect(canAccessSection(staffWithIntake, 'erfassung')).toBe(true)
  })

  it('supports reverse aliases (intake access for erfassung permission)', () => {
    const staffWithErfassung: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['erfassung'],
    }
    expect(canAccessSection(staffWithErfassung, 'intake')).toBe(true)
  })
})

// ============================================================================
// canAccessSensitive
// ============================================================================

describe('canAccessSensitive', () => {
  it('returns true for super admins', () => {
    const superAdmin: StaffUser = {
      email: 'andreas@revamp-it.ch',
      is_staff: true,
      staff_permissions: [],
    }
    expect(canAccessSensitive(superAdmin)).toBe(true)
  })

  it('returns true for wildcard permission', () => {
    const wildcardStaff: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['*'],
    }
    expect(canAccessSensitive(wildcardStaff)).toBe(true)
  })

  it('returns true when user has sensitive section permission', () => {
    // Get one sensitive section from config
    if (SENSITIVE_SECTION_IDS.length > 0) {
      const sensitiveSection = SENSITIVE_SECTION_IDS[0]
      const staff: StaffUser = {
        email: 'staff@revamp-it.ch',
        is_staff: true,
        staff_permissions: [sensitiveSection],
      }
      expect(canAccessSensitive(staff)).toBe(true)
    }
  })

  it('returns false for staff without sensitive permissions', () => {
    const staff: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['dashboard'],
    }
    expect(canAccessSensitive(staff)).toBe(false)
  })

  it('returns false for non-staff', () => {
    expect(canAccessSensitive(null)).toBe(false)
  })
})

// ============================================================================
// getAccessibleSections
// ============================================================================

describe('getAccessibleSections', () => {
  it('returns all sections for super admin', () => {
    const superAdmin: StaffUser = {
      email: 'andreas@revamp-it.ch',
      is_staff: true,
      staff_permissions: [],
    }
    const sections = getAccessibleSections(superAdmin)
    expect(sections).toEqual(ADMIN_SECTION_IDS)
  })

  it('returns all sections for wildcard user', () => {
    const wildcard: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['*'],
    }
    expect(getAccessibleSections(wildcard)).toEqual(ADMIN_SECTION_IDS)
  })

  it('returns only permitted sections for regular staff', () => {
    const staff: StaffUser = {
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['dashboard', 'marketplace'],
    }
    const sections = getAccessibleSections(staff)
    expect(sections).toContain('dashboard')
    expect(sections).toContain('marketplace')
    expect(sections).not.toContain('hirn')
  })

  it('returns empty for non-staff', () => {
    expect(getAccessibleSections(null)).toEqual([])
    expect(getAccessibleSections({ email: 'x', is_staff: false, staff_permissions: [] })).toEqual([])
  })
})

// ============================================================================
// getInitialStaffPermissions
// ============================================================================

describe('getInitialStaffPermissions', () => {
  it('returns wildcard for super admins', () => {
    expect(getInitialStaffPermissions('andreas@revamp-it.ch')).toEqual(['*'])
  })

  it('returns default permissions for regular staff', () => {
    const perms = getInitialStaffPermissions('newstaff@revamp-it.ch')
    expect(perms).toEqual(DEFAULT_STAFF_PERMISSIONS)
    // Default should not contain sensitive sections
    SENSITIVE_SECTION_IDS.forEach(sid => {
      expect(perms).not.toContain(sid)
    })
  })
})

// ============================================================================
// Constants
// ============================================================================

describe('auth constants', () => {
  it('has correct staff domain', () => {
    expect(STAFF_EMAIL_DOMAIN).toBe('revamp-it.ch')
  })

  it('has super admin emails defined', () => {
    expect(SUPER_ADMIN_EMAILS.length).toBeGreaterThan(0)
    SUPER_ADMIN_EMAILS.forEach(email => {
      expect(email).toContain('@revamp-it.ch')
    })
  })

  it('has content status values', () => {
    expect(CONTENT_STATUS.DRAFT).toBe('draft')
    expect(CONTENT_STATUS.PENDING).toBe('pending')
    expect(CONTENT_STATUS.APPROVED).toBe('approved')
    expect(CONTENT_STATUS.REJECTED).toBe('rejected')
    expect(CONTENT_STATUS.ARCHIVED).toBe('archived')
  })

  it('has admin sections defined', () => {
    expect(Object.keys(ADMIN_SECTIONS).length).toBeGreaterThan(0)
  })

  it('has sensitive sections defined', () => {
    expect(SENSITIVE_SECTION_IDS.length).toBeGreaterThan(0)
  })
})
