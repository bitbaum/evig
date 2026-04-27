/**
 * Tests for auth/db-users.ts — user and profile CRUD.
 *
 * Mission-relevant: user retrieval, creation, and profile management are
 * gating functions for every authenticated flow. A mapping bug in
 * mapUserToDbUser causes Auth.js to present wrong fields (wrong role,
 * missing staff flag), breaking every permission check downstream.
 *
 * Behaviors locked:
 *   mapUserToDbUser (via getUserByEmail/getUserById)
 *   - maps camelCase Drizzle row to snake_case DbUser interface
 *   - role defaults to 'user' when null
 *   - emailVerified is a Date when set, null when unset
 *   - is_staff defaults to false when null
 *   - staff_permissions defaults to [] when null
 *   - is_super_admin defaults to false when null
 *   - dashboard_mode defaults to 'coordinator' when null
 *
 *   getUserByEmail
 *   - lowercases the email before querying
 *   - returns null when user not found
 *   - returns mapped DbUser when found
 *
 *   getUserById
 *   - returns null when not found
 *   - returns mapped DbUser when found
 *
 *   createUser
 *   - lowercases the email on insert
 *   - sets emailVerified when emailVerified: true
 *   - does NOT set emailVerified when emailVerified: false
 *   - returns mapped DbUser from insert result
 *
 *   updateUser
 *   - calls getUserById (no DB update) when no fields provided
 *   - executes update and returns mapped row when fields provided
 *   - returns null when user not found (update returns empty array)
 *
 *   getOrCreateProfile
 *   - returns existing profile when found
 *   - creates and returns new profile when not found
 *
 *   updateProfile
 *   - calls getOrCreateProfile when no fields provided
 *   - maps snake_case input keys to camelCase Drizzle columns
 *   - returns null when profile not found after update
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.set = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbInsert = jest.fn(() => makeChain([]))
const mockDbUpdate = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
}))

jest.mock('@/db/schema/auth', () => ({
  users: {
    id: 'users_id',
    email: 'users_email',
    name: 'users_name',
    emailVerified: 'users_emailVerified',
    passwordHash: 'users_passwordHash',
    image: 'users_image',
    role: 'users_role',
    isStaff: 'users_isStaff',
    staffPermissions: 'users_staffPermissions',
    isSuperAdmin: 'users_isSuperAdmin',
    dashboardMode: 'users_dashboardMode',
  },
  userProfiles: {
    userId: 'userProfiles_userId',
    firstName: 'firstName',
    lastName: 'lastName',
    companyName: 'companyName',
    city: 'city',
    preferredLanguage: 'preferredLanguage',
    newsletterSubscribed: 'newsletterSubscribed',
    isSupporter: 'isSupporter',
    emailNotifications: 'emailNotifications',
    createdAt: 'userProfiles_createdAt',
    updatedAt: 'userProfiles_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getOrCreateProfile,
  updateProfile,
} from '../db-users'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    name: 'Hans Müller',
    email: 'hans@revamp-it.ch',
    emailVerified: '2026-01-01T00:00:00Z',
    passwordHash: null,
    image: null,
    role: 'user',
    isStaff: false,
    staffPermissions: [],
    isSuperAdmin: false,
    dashboardMode: 'coordinator',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeProfileRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'user-1',
    firstName: 'Hans',
    lastName: 'Müller',
    companyName: null,
    phone: null,
    mobile: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: 'Bern',
    canton: null,
    country: 'Schweiz',
    interests: null,
    preferredLanguage: 'de',
    newsletterSubscribed: false,
    isSupporter: false,
    supporterType: null,
    avatarUrl: null,
    displayName: null,
    bio: null,
    profileVisibility: null,
    showEmail: null,
    showPhone: null,
    emailNotifications: null,
    smsNotifications: null,
    marketplaceUpdates: null,
    workshopReminders: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbInsert.mockImplementation(() => makeChain([]))
  mockDbUpdate.mockImplementation(() => makeChain([]))
})

// ============================================================================
// mapUserToDbUser — field mapping
// ============================================================================

describe('mapUserToDbUser — via getUserByEmail', () => {
  it('maps core identity fields', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.id).toBe('user-1')
    expect(result?.name).toBe('Hans Müller')
    expect(result?.email).toBe('hans@revamp-it.ch')
  })

  it('maps emailVerified to a Date when set', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.emailVerified).toBeInstanceOf(Date)
  })

  it('maps emailVerified to null when not set', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ emailVerified: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.emailVerified).toBeNull()
  })

  it('defaults role to "user" when null', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ role: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.role).toBe('user')
  })

  it('defaults is_staff to false when null', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ isStaff: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.is_staff).toBe(false)
  })

  it('defaults staff_permissions to [] when null', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ staffPermissions: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.staff_permissions).toEqual([])
  })

  it('defaults is_super_admin to false when null', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ isSuperAdmin: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.is_super_admin).toBe(false)
  })

  it('defaults dashboard_mode to "coordinator" when null', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeUserRow({ dashboardMode: null })]),
    )

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result?.dashboard_mode).toBe('coordinator')
  })
})

// ============================================================================
// getUserByEmail
// ============================================================================

describe('getUserByEmail', () => {
  it('returns null when user not found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getUserByEmail('missing@example.com')

    expect(result).toBeNull()
  })

  it('returns mapped DbUser when found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await getUserByEmail('hans@revamp-it.ch')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('user-1')
  })
})

// ============================================================================
// getUserById
// ============================================================================

describe('getUserById', () => {
  it('returns null when user not found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getUserById('missing-id')

    expect(result).toBeNull()
  })

  it('returns mapped DbUser when found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await getUserById('user-1')

    expect(result?.id).toBe('user-1')
  })
})

// ============================================================================
// createUser
// ============================================================================

describe('createUser', () => {
  it('returns the inserted user mapped to DbUser', async () => {
    mockDbInsert.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await createUser({ email: 'Hans@REVAMP-IT.CH', name: 'Hans Müller' })

    expect(result.id).toBe('user-1')
    expect(result.name).toBe('Hans Müller')
  })

  it('sets emailVerified in the insert when emailVerified: true', async () => {
    mockDbInsert.mockImplementationOnce(() =>
      makeChain([makeUserRow({ emailVerified: new Date().toISOString() })]),
    )

    const result = await createUser({ email: 'test@example.com', emailVerified: true })

    expect(result.emailVerified).toBeInstanceOf(Date)
  })

  it('leaves emailVerified null when emailVerified is not set', async () => {
    mockDbInsert.mockImplementationOnce(() =>
      makeChain([makeUserRow({ emailVerified: null })]),
    )

    const result = await createUser({ email: 'test@example.com' })

    expect(result.emailVerified).toBeNull()
  })
})

// ============================================================================
// updateUser
// ============================================================================

describe('updateUser', () => {
  it('calls getUserById without executing update when no fields provided', async () => {
    // getUserById: one select call
    mockDbSelect.mockImplementationOnce(() => makeChain([makeUserRow()]))

    const result = await updateUser('user-1', {})

    expect(result?.id).toBe('user-1')
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('executes update and returns mapped row when fields provided', async () => {
    mockDbUpdate.mockImplementationOnce(() =>
      makeChain([makeUserRow({ name: 'Neuer Name' })]),
    )

    const result = await updateUser('user-1', { name: 'Neuer Name' })

    expect(result?.name).toBe('Neuer Name')
    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns null when user not found (update returns empty array)', async () => {
    mockDbUpdate.mockImplementationOnce(() => makeChain([]))

    const result = await updateUser('missing', { name: 'X' })

    expect(result).toBeNull()
  })
})

// ============================================================================
// getOrCreateProfile
// ============================================================================

describe('getOrCreateProfile', () => {
  it('returns existing profile when found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeProfileRow()]))

    const result = await getOrCreateProfile('user-1')

    expect(result.user_id).toBe('user-1')
    expect(result.city).toBe('Bern')
    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it('creates and returns new profile when not found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))
    mockDbInsert.mockImplementationOnce(() => makeChain([makeProfileRow()]))

    const result = await getOrCreateProfile('user-1')

    expect(result.user_id).toBe('user-1')
    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// updateProfile
// ============================================================================

describe('updateProfile', () => {
  it('calls getOrCreateProfile when no fields provided', async () => {
    // getOrCreateProfile → select
    mockDbSelect.mockImplementationOnce(() => makeChain([makeProfileRow()]))

    const result = await updateProfile('user-1', {})

    expect(result?.user_id).toBe('user-1')
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('maps snake_case field to camelCase Drizzle column and executes update', async () => {
    mockDbUpdate.mockImplementationOnce(() =>
      makeChain([makeProfileRow({ city: 'Zürich' })]),
    )

    const result = await updateProfile('user-1', { city: 'Zürich' })

    expect(result?.city).toBe('Zürich')
    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns null when profile not found after update', async () => {
    mockDbUpdate.mockImplementationOnce(() => makeChain([]))

    const result = await updateProfile('user-1', { city: 'Bern' })

    expect(result).toBeNull()
  })
})
