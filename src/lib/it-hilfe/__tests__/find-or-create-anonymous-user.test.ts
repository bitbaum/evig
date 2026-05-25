/**
 * Tests for findOrCreateAnonymousUser.
 *
 * Covers: existing-user lookup, new-user creation, email normalisation
 * (trim + lowercase) so case-/whitespace-variant emails resolve to the
 * same account, and invalid-email rejection.
 */

const mockGetUserByEmail = jest.fn()
const mockCreateUser = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
}))

import { findOrCreateAnonymousUser } from '../find-or-create-anonymous-user'

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// Existing user
// ============================================================================

describe('findOrCreateAnonymousUser — existing user', () => {
  it('returns the existing userId with wasCreated: false', async () => {
    mockGetUserByEmail.mockResolvedValueOnce({ id: 'user-1', email: 'foo@bar.com' })
    const result = await findOrCreateAnonymousUser('foo@bar.com')
    expect(result).toEqual({ userId: 'user-1', wasCreated: false })
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('finds the user even when the input email has trailing whitespace', async () => {
    mockGetUserByEmail.mockResolvedValueOnce({ id: 'user-1', email: 'foo@bar.com' })
    await findOrCreateAnonymousUser('  foo@bar.com  ')
    expect(mockGetUserByEmail).toHaveBeenCalledWith('foo@bar.com')
  })

  it('finds the user when the input email is uppercase', async () => {
    mockGetUserByEmail.mockResolvedValueOnce({ id: 'user-1', email: 'foo@bar.com' })
    await findOrCreateAnonymousUser('FOO@BAR.COM')
    expect(mockGetUserByEmail).toHaveBeenCalledWith('foo@bar.com')
  })
})

// ============================================================================
// New user
// ============================================================================

describe('findOrCreateAnonymousUser — new user', () => {
  it('creates a new user when none exists, returns wasCreated: true', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    mockCreateUser.mockResolvedValueOnce({ id: 'new-user-1', email: 'new@example.com' })

    const result = await findOrCreateAnonymousUser('new@example.com')
    expect(result).toEqual({ userId: 'new-user-1', wasCreated: true })
  })

  it('passes only the normalised email to createUser (no password)', async () => {
    mockGetUserByEmail.mockResolvedValueOnce(null)
    mockCreateUser.mockResolvedValueOnce({ id: 'new-user-2', email: 'a@b.co' })

    await findOrCreateAnonymousUser('  A@B.co  ')
    expect(mockCreateUser).toHaveBeenCalledWith({ email: 'a@b.co' })
    // Critically: no password_hash, no emailVerified — these remain
    // null so the claim flow has work to do.
  })
})

// ============================================================================
// Validation
// ============================================================================

describe('findOrCreateAnonymousUser — invalid input', () => {
  it.each([
    '',
    '   ',
    'not-an-email',
    'missing-at-sign.com',
    '@nothing-before.com',
    'nothing-after@',
    'spaces in@email.com',
  ])('rejects %p', async (bad) => {
    await expect(findOrCreateAnonymousUser(bad)).rejects.toThrow(/email/i)
    expect(mockGetUserByEmail).not.toHaveBeenCalled()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })
})
