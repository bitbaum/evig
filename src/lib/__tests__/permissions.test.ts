/**
 * Tests for lib/permissions.ts
 *
 * Permission checks are the security boundary for the admin dashboard.
 * Wrong logic = unauthorized access or staff being incorrectly locked out.
 */

// Mock sections to avoid lucide-react icons in test environment
jest.mock('@/config/sections', () => ({
  SECTIONS: {},
  ADMIN_SECTION_IDS: ['dashboard', 'products', 'workshops', 'users', 'hirn', 'finanzen', 'my-timecards'],
  SENSITIVE_SECTION_IDS: ['users', 'hirn', 'finanzen'],
  STAFF_UNIVERSAL_SECTION_IDS: ['my-timecards'],
  getAdminSections: () => [],
  isSensitiveSection: (id: string) => ['users', 'hirn', 'finanzen'].includes(id),
}))

import {
  isStaffEmail,
  isSuperAdmin,
  canAccessSection,
  canAccessSensitive,
  getAccessibleSections,
  getInitialStaffPermissions,
  toStaffUser,
  SUPER_ADMIN_EMAILS,
  STAFF_EMAIL_DOMAIN,
  type StaffUser,
} from '../permissions'

// ============================================================================
// isStaffEmail
// ============================================================================

describe('isStaffEmail', () => {
  it('returns true for @revamp-it.ch email', () => {
    expect(isStaffEmail('user@revamp-it.ch')).toBe(true)
  })

  it('returns false for non-staff email', () => {
    expect(isStaffEmail('user@gmail.com')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isStaffEmail(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isStaffEmail(undefined)).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isStaffEmail('User@REVAMP-IT.CH')).toBe(true)
  })

  it('accepts the legacy seed admin domain', () => {
    expect(isStaffEmail('admin@revampit.ch')).toBe(true)
  })

  it('does not match subdomain spoofing', () => {
    expect(isStaffEmail('user@fake.revamp-it.ch.evil.com')).toBe(false)
  })

  it('STAFF_EMAIL_DOMAIN constant matches', () => {
    expect(isStaffEmail(`test@${STAFF_EMAIL_DOMAIN}`)).toBe(true)
  })
})

// ============================================================================
// isSuperAdmin
// ============================================================================

describe('isSuperAdmin', () => {
  it('returns true for a known super admin email', () => {
    expect(isSuperAdmin('andreas@revamp-it.ch')).toBe(true)
  })

  it('returns false for a regular staff email', () => {
    expect(isSuperAdmin('regular@revamp-it.ch')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSuperAdmin(null)).toBe(false)
  })

  it('returns true when isSuperAdminFromDb is true, regardless of email', () => {
    expect(isSuperAdmin('anyone@example.com', true)).toBe(true)
  })

  it('isSuperAdminFromDb=false does not override email check', () => {
    expect(isSuperAdmin('andreas@revamp-it.ch', false)).toBe(true)
  })

  it('all SUPER_ADMIN_EMAILS entries return true', () => {
    for (const email of SUPER_ADMIN_EMAILS) {
      expect(isSuperAdmin(email)).toBe(true)
    }
  })
})

// ============================================================================
// canAccessSection
// ============================================================================

describe('canAccessSection', () => {
  const superAdmin: StaffUser = {
    email: 'andreas@revamp-it.ch',
    is_staff: true,
    staff_permissions: [],
  }

  const wildcardStaff: StaffUser = {
    email: 'staff@revamp-it.ch',
    is_staff: true,
    staff_permissions: ['*'],
  }

  const limitedStaff: StaffUser = {
    email: 'limited@revamp-it.ch',
    is_staff: true,
    staff_permissions: ['dashboard', 'products'],
  }

  const nonStaff: StaffUser = {
    email: 'user@gmail.com',
    is_staff: false,
    staff_permissions: [],
  }

  it('returns false for null user', () => {
    expect(canAccessSection(null, 'dashboard')).toBe(false)
  })

  it('returns false for non-staff user', () => {
    expect(canAccessSection(nonStaff, 'dashboard')).toBe(false)
  })

  it('super admin can access any section', () => {
    expect(canAccessSection(superAdmin, 'dashboard')).toBe(true)
    expect(canAccessSection(superAdmin, 'users')).toBe(true)
    expect(canAccessSection(superAdmin, 'hirn')).toBe(true)
  })

  it('wildcard permission grants access to any section', () => {
    expect(canAccessSection(wildcardStaff, 'users')).toBe(true)
    expect(canAccessSection(wildcardStaff, 'finanzen')).toBe(true)
  })

  it('limited staff can access their permitted sections', () => {
    expect(canAccessSection(limitedStaff, 'dashboard')).toBe(true)
    expect(canAccessSection(limitedStaff, 'products')).toBe(true)
  })

  it('limited staff cannot access unpermitted sections', () => {
    expect(canAccessSection(limitedStaff, 'users')).toBe(false)
    expect(canAccessSection(limitedStaff, 'hirn')).toBe(false)
  })

  it('grants access via alias: "erfassung" section is granted by "intake" permission', () => {
    const withAlias: StaffUser = {
      email: 'alias@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['intake'],
    }
    // Requesting 'erfassung' section with 'intake' permission → alias grants access
    expect(canAccessSection(withAlias, 'erfassung')).toBe(true)
  })

  it('grants access via reverse alias: "erfassung" permission grants "intake" section', () => {
    const withReverse: StaffUser = {
      email: 'old@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['erfassung'],
    }
    expect(canAccessSection(withReverse, 'intake')).toBe(true)
  })
})

// ============================================================================
// canAccessSensitive
// ============================================================================

describe('canAccessSensitive', () => {
  it('returns false for null', () => {
    expect(canAccessSensitive(null)).toBe(false)
  })

  it('returns false for non-staff', () => {
    expect(canAccessSensitive({ email: 'x@gmail.com', is_staff: false, staff_permissions: [] })).toBe(false)
  })

  it('super admin can access sensitive', () => {
    expect(canAccessSensitive({ email: 'andreas@revamp-it.ch', is_staff: true, staff_permissions: [] })).toBe(true)
  })

  it('wildcard permission grants sensitive access', () => {
    expect(canAccessSensitive({ email: 'x@revamp-it.ch', is_staff: true, staff_permissions: ['*'] })).toBe(true)
  })

  it('staff with a sensitive section permission can access sensitive', () => {
    expect(canAccessSensitive({ email: 'x@revamp-it.ch', is_staff: true, staff_permissions: ['users'] })).toBe(true)
  })

  it('staff without any sensitive permission cannot access sensitive', () => {
    expect(canAccessSensitive({ email: 'x@revamp-it.ch', is_staff: true, staff_permissions: ['dashboard', 'products'] })).toBe(false)
  })
})

// ============================================================================
// getAccessibleSections
// ============================================================================

describe('getAccessibleSections', () => {
  it('returns empty array for null', () => {
    expect(getAccessibleSections(null)).toEqual([])
  })

  it('returns empty array for non-staff', () => {
    expect(getAccessibleSections({ email: 'x@gmail.com', is_staff: false, staff_permissions: [] })).toEqual([])
  })

  it('super admin gets all admin sections', () => {
    const sections = getAccessibleSections({ email: 'andreas@revamp-it.ch', is_staff: true, staff_permissions: [] })
    // Should include all ADMIN_SECTION_IDS from mock
    expect(sections.length).toBeGreaterThan(0)
    expect(sections).toContain('dashboard')
  })

  it('wildcard permission returns all sections', () => {
    const sections = getAccessibleSections({ email: 'x@revamp-it.ch', is_staff: true, staff_permissions: ['*'] })
    expect(sections).toContain('dashboard')
    expect(sections).toContain('users')
  })

  it('limited staff only gets their permitted sections', () => {
    const sections = getAccessibleSections({
      email: 'x@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['dashboard', 'products'],
    })
    expect(sections).toContain('dashboard')
    expect(sections).toContain('products')
    expect(sections).not.toContain('users')
    expect(sections).not.toContain('hirn')
  })
})

// ============================================================================
// getInitialStaffPermissions
// ============================================================================

describe('getInitialStaffPermissions', () => {
  it('returns ["*"] for super admins', () => {
    expect(getInitialStaffPermissions('andreas@revamp-it.ch')).toEqual(['*'])
  })

  it('returns non-sensitive sections for regular staff', () => {
    const perms = getInitialStaffPermissions('new@revamp-it.ch')
    expect(perms).not.toContain('*')
    // Non-sensitive sections should be included; sensitive ones excluded
    expect(perms).not.toContain('users')
    expect(perms).not.toContain('hirn')
    expect(perms).not.toContain('finanzen')
    expect(perms).toContain('dashboard')
    expect(perms).toContain('products')
  })
})

// ============================================================================
// toStaffUser
// ============================================================================

describe('toStaffUser', () => {
  it('converts camelCase session user to snake_case StaffUser', () => {
    const result = toStaffUser({
      email: 'staff@revamp-it.ch',
      isStaff: true,
      staffPermissions: ['dashboard'],
      isSuperAdmin: false,
    })
    expect(result).toEqual({
      email: 'staff@revamp-it.ch',
      is_staff: true,
      staff_permissions: ['dashboard'],
      is_super_admin: false,
    })
  })

  it('handles undefined isSuperAdmin', () => {
    const result = toStaffUser({
      email: 'x@revamp-it.ch',
      isStaff: false,
      staffPermissions: [],
    })
    expect(result.is_super_admin).toBeUndefined()
  })
})
