/**
 * Tests for auth/db-roles.ts — roles, permissions, preferences, and segments.
 *
 * Mission-relevant: this module controls what staff and users can do across
 * the platform. A broken permission lookup grants access that shouldn't be
 * granted; a broken preference upsert silently loses user settings.
 *
 * Behaviors locked:
 *   getUserRoleById / getUserRoleBySlug
 *   - returns null when not found
 *   - returns DbUserRole when found
 *
 *   getActiveUserRoles
 *   - returns empty array when none exist
 *   - returns array of active roles
 *
 *   getRolePermissions
 *   - returns empty array when no permissions
 *   - returns array of DbPermission rows
 *
 *   userHasPermission
 *   - returns false when user lacks the permission
 *   - returns true when user has the permission
 *
 *   getUserPreferences
 *   - returns empty array when none set
 *   - returns array of DbCustomerPreference rows
 *
 *   setUserPreference
 *   - calls db.execute once and returns upserted preference
 *
 *   getUserSegments
 *   - returns empty array when none assigned
 *   - returns joined segment rows
 *
 *   addUserToSegment
 *   - returns null when segment slug not found
 *   - returns null when INSERT hits conflict (empty RETURNING)
 *   - returns DbUserSegment on successful insert
 *
 *   updateUserLastActivity
 *   - calls db.execute once
 *
 *   getUserWithProfile
 *   - returns null when user not found
 *   - returns user + profile when no role_id set
 *   - returns user + profile + role_info + permissions when role_id present
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    USER_ROLES: 'user_roles',
    PERMISSIONS: 'permissions',
    ROLE_PERMISSIONS: 'role_permissions',
    USERS: 'users',
    USER_PROFILES: 'user_profiles',
    CUSTOMER_PREFERENCES: 'customer_preferences',
    CUSTOMER_SEGMENTS: 'customer_segments',
    USER_SEGMENTS: 'user_segments',
  },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getUserRoleById,
  getUserRoleBySlug,
  getActiveUserRoles,
  getRolePermissions,
  userHasPermission,
  getUserPreferences,
  setUserPreference,
  getUserSegments,
  addUserToSegment,
  updateUserLastActivity,
  getUserWithProfile,
} from '../db-roles'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRole(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'role-1',
    slug: 'admin',
    name: 'Administrator',
    description: null,
    is_active: true,
    is_default: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePermission(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'perm-1',
    slug: 'products:read',
    name: 'Read Products',
    description: null,
    resource: 'products',
    action: 'read',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePreference(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pref-1',
    user_id: 'user-1',
    preference_key: 'theme',
    preference_value: 'dark',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSegment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'seg-1',
    user_id: 'user-1',
    segment_id: 'seg-1',
    assigned_at: '2026-01-01T00:00:00Z',
    assigned_by: null,
    notes: null,
    slug: 'early-adopter',
    name: 'Early Adopter',
    ...overrides,
  }
}

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'hans@revamp-it.ch',
    name: 'Hans',
    role_id: null,
    ...overrides,
  }
}

function makeProfile() {
  return {
    user_id: 'user-1',
    first_name: 'Hans',
    last_name: 'Müller',
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbExecute.mockResolvedValue({ rows: [] })
})

// ============================================================================
// getUserRoleById
// ============================================================================

describe('getUserRoleById', () => {
  it('returns null when role not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getUserRoleById('missing-id')

    expect(result).toBeNull()
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('returns DbUserRole when found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeRole()] })

    const result = await getUserRoleById('role-1')

    expect(result?.id).toBe('role-1')
    expect(result?.slug).toBe('admin')
  })
})

// ============================================================================
// getUserRoleBySlug
// ============================================================================

describe('getUserRoleBySlug', () => {
  it('returns null when slug not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getUserRoleBySlug('nonexistent')

    expect(result).toBeNull()
  })

  it('returns DbUserRole when slug found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeRole()] })

    const result = await getUserRoleBySlug('admin')

    expect(result?.slug).toBe('admin')
  })
})

// ============================================================================
// getActiveUserRoles
// ============================================================================

describe('getActiveUserRoles', () => {
  it('returns empty array when no active roles exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getActiveUserRoles()

    expect(result).toEqual([])
  })

  it('returns all active roles', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeRole(), makeRole({ id: 'role-2', slug: 'moderator' })],
    })

    const result = await getActiveUserRoles()

    expect(result).toHaveLength(2)
    expect(result[1].slug).toBe('moderator')
  })
})

// ============================================================================
// getRolePermissions
// ============================================================================

describe('getRolePermissions', () => {
  it('returns empty array when no permissions', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getRolePermissions('role-1')

    expect(result).toEqual([])
  })

  it('returns array of DbPermission rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makePermission()] })

    const result = await getRolePermissions('role-1')

    expect(result[0].slug).toBe('products:read')
    expect(result[0].resource).toBe('products')
  })
})

// ============================================================================
// userHasPermission
// ============================================================================

describe('userHasPermission', () => {
  it('returns false when user lacks the permission', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await userHasPermission('user-1', 'admin:write')

    expect(result).toBe(false)
  })

  it('returns true when user has the permission', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ 1: 1 }] })

    const result = await userHasPermission('user-1', 'products:read')

    expect(result).toBe(true)
  })
})

// ============================================================================
// getUserPreferences
// ============================================================================

describe('getUserPreferences', () => {
  it('returns empty array when no preferences set', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getUserPreferences('user-1')

    expect(result).toEqual([])
  })

  it('returns array of preference rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makePreference()] })

    const result = await getUserPreferences('user-1')

    expect(result[0].preference_key).toBe('theme')
    expect(result[0].preference_value).toBe('dark')
  })
})

// ============================================================================
// setUserPreference
// ============================================================================

describe('setUserPreference', () => {
  it('calls db.execute once and returns the upserted preference', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makePreference({ preference_value: 'light' })],
    })

    const result = await setUserPreference('user-1', 'theme', 'light')

    expect(mockDbExecute).toHaveBeenCalledTimes(1)
    expect(result.preference_key).toBe('theme')
    expect(result.preference_value).toBe('light')
  })
})

// ============================================================================
// getUserSegments
// ============================================================================

describe('getUserSegments', () => {
  it('returns empty array when no segments assigned', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getUserSegments('user-1')

    expect(result).toEqual([])
  })

  it('returns joined segment rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeSegment()] })

    const result = await getUserSegments('user-1')

    expect(result[0].user_id).toBe('user-1')
    expect((result[0] as unknown as { slug: string }).slug).toBe('early-adopter')
  })
})

// ============================================================================
// addUserToSegment
// ============================================================================

describe('addUserToSegment', () => {
  it('returns null when segment slug not found', async () => {
    // segment lookup returns empty
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await addUserToSegment('user-1', 'nonexistent-slug')

    expect(result).toBeNull()
    // Only 1 execute: the segment lookup — no INSERT attempted
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('returns null when INSERT hits a conflict and RETURNING is empty', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: 'seg-1' }] }) // segment found
      .mockResolvedValueOnce({ rows: [] })                 // INSERT conflict

    const result = await addUserToSegment('user-1', 'early-adopter')

    expect(result).toBeNull()
  })

  it('returns DbUserSegment on successful insert', async () => {
    const segmentRow = { id: 'seg-1' }
    const insertedRow = {
      id: 'us-1',
      user_id: 'user-1',
      segment_id: 'seg-1',
      assigned_at: '2026-01-01T00:00:00Z',
      assigned_by: null,
      notes: null,
    }
    mockDbExecute
      .mockResolvedValueOnce({ rows: [segmentRow] })
      .mockResolvedValueOnce({ rows: [insertedRow] })

    const result = await addUserToSegment('user-1', 'early-adopter', 'admin-user')

    expect(result?.user_id).toBe('user-1')
    expect(result?.segment_id).toBe('seg-1')
  })
})

// ============================================================================
// updateUserLastActivity
// ============================================================================

describe('updateUserLastActivity', () => {
  it('calls db.execute exactly once', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    await updateUserLastActivity('user-1')

    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// getUserWithProfile
// ============================================================================

describe('getUserWithProfile', () => {
  it('returns null when user not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getUserWithProfile('missing-id')

    expect(result).toBeNull()
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('returns user with profile when no role_id set', async () => {
    // user (no role_id), profile
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeUser()] })
      .mockResolvedValueOnce({ rows: [makeProfile()] })

    const result = await getUserWithProfile('user-1')

    expect(result?.id).toBe('user-1')
    expect(result?.profile).toBeDefined()
    expect(result?.role_info).toBeUndefined()
    expect(result?.permissions).toBeUndefined()
    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })

  it('returns user + role_info + permissions when role_id is set', async () => {
    // user (with role_id), profile, role, permissions
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeUser({ role_id: 'role-1' })] })
      .mockResolvedValueOnce({ rows: [makeProfile()] })
      .mockResolvedValueOnce({ rows: [makeRole()] })
      .mockResolvedValueOnce({ rows: [makePermission()] }) // getRolePermissions

    const result = await getUserWithProfile('user-1')

    expect(result?.role_info?.slug).toBe('admin')
    expect(result?.permissions).toHaveLength(1)
    expect(result?.permissions?.[0].slug).toBe('products:read')
    // user + profile + role + permissions (via getRolePermissions)
    expect(mockDbExecute).toHaveBeenCalledTimes(4)
  })
})
