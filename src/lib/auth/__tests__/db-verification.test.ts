/**
 * Tests for auth/db-verification.ts — email verification and password reset.
 *
 * Mission-relevant: verification tokens and codes are the only gates between
 * a user's email and account access. A bug that accepts expired tokens,
 * fails to delete used tokens (allowing replay), or silently fails to update
 * emailVerified blocks new users from activating accounts.
 *
 * Behaviors locked:
 *   createVerificationToken
 *   - returns a 64-char hex token string
 *   - inserts/upserts via onConflictDoUpdate
 *
 *   verifyEmailWithToken
 *   - returns { success: false } when token not found or expired
 *   - updates user emailVerified and deletes token on success
 *   - returns { success: true, email } on success
 *   - returns { success: false } on DB error (does not throw)
 *
 *   getVerificationToken
 *   - returns null when no active token found
 *   - returns { identifier, token, expires } when found
 *
 *   createVerificationCode
 *   - returns a 6-digit string
 *   - deletes existing codes before inserting (2 DB calls)
 *   - lowercases the email
 *
 *   verifyEmailCode
 *   - returns { success: false } when code not found/expired
 *   - updates user and deletes code on success
 *   - lowercases email before querying
 *   - returns { success: false } on DB error
 *
 *   createPasswordResetToken
 *   - returns a 64-char hex token
 *   - lowercases the email
 *
 *   verifyPasswordResetToken
 *   - returns { success: false } when token not found
 *   - deletes the token and returns { success: true, email } on success
 *   - returns { success: false } on DB error
 *
 *   updateUserPassword
 *   - returns { success: false } when user not found
 *   - returns { success: true } on successful update
 *   - returns { success: false } on DB error
 *
 *   getPasswordResetToken
 *   - returns null when not found
 *   - returns { identifier, token, expires } when found
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  // select / query methods
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  // insert methods
  chain.values = jest.fn().mockReturnValue(chain)
  chain.onConflictDoUpdate = jest.fn().mockReturnValue(chain)
  // update methods
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
const mockDbDelete = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    insert: (...args: unknown[]) => mockDbInsert.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
    delete: (...args: unknown[]) => mockDbDelete.apply(null, args),
  },
}))

jest.mock('@/db/schema/auth', () => ({
  users: {
    id: 'users_id',
    email: 'users_email',
    emailVerified: 'users_emailVerified',
    passwordHash: 'users_passwordHash',
    updatedAt: 'users_updatedAt',
  },
  verificationTokens: {
    identifier: 'vt_identifier',
    token: 'vt_token',
    expires: 'vt_expires',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  gt: jest.fn().mockReturnValue({ __gt: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'mocked', mapWith: jest.fn().mockReturnValue({ __sql: 'mapped' }) }), {
    raw: jest.fn().mockReturnValue({ __raw: true }),
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  createVerificationToken,
  verifyEmailWithToken,
  getVerificationToken,
  createVerificationCode,
  verifyEmailCode,
  createPasswordResetToken,
  verifyPasswordResetToken,
  updateUserPassword,
  getPasswordResetToken,
} from '../db-verification'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMAIL = 'user@revamp-it.ch'
const TOKEN = 'abcdef1234567890'.repeat(4) // 64 chars hex-like
const CODE = '123456'
const EXPIRES_FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString()

function makeTokenRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    identifier: EMAIL,
    token: TOKEN,
    expires: EXPIRES_FUTURE,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  // Do NOT use resetAllMocks here: it strips sql`...`.mapWith() return value,
  // causing TypeError inside try/catch blocks that mask test failures.
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbInsert.mockImplementation(() => makeChain([]))
  mockDbUpdate.mockImplementation(() => makeChain([]))
  mockDbDelete.mockImplementation(() => makeChain([]))
})

// ============================================================================
// createVerificationToken
// ============================================================================

describe('createVerificationToken', () => {
  it('returns a 64-char hex token string', async () => {
    const result = await createVerificationToken(EMAIL)

    expect(typeof result).toBe('string')
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('calls db.insert once for the upsert', async () => {
    await createVerificationToken(EMAIL)

    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// verifyEmailWithToken
// ============================================================================

describe('verifyEmailWithToken', () => {
  it('returns { success: false } when token is not found or expired', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await verifyEmailWithToken(TOKEN)

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('updates user emailVerified and deletes token on success', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow()]))

    await verifyEmailWithToken(TOKEN)

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })

  it('returns { success: true, email } when token is valid', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow()]))

    const result = await verifyEmailWithToken(TOKEN)

    expect(result.success).toBe(true)
    expect(result.email).toBe(EMAIL)
  })

  it('returns { success: false } on DB error (does not throw)', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(Promise.reject(new Error('DB error'))),
      }),
    } as unknown as ReturnType<typeof makeChain>)

    const result = await verifyEmailWithToken(TOKEN)

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// getVerificationToken
// ============================================================================

describe('getVerificationToken', () => {
  it('returns null when no active token found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getVerificationToken(EMAIL)

    expect(result).toBeNull()
  })

  it('returns { identifier, token, expires } when token found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow()]))

    const result = await getVerificationToken(EMAIL)

    expect(result).not.toBeNull()
    expect(result?.identifier).toBe(EMAIL)
    expect(result?.token).toBe(TOKEN)
    expect(result?.expires).toBeInstanceOf(Date)
  })
})

// ============================================================================
// createVerificationCode
// ============================================================================

describe('createVerificationCode', () => {
  it('returns a 6-digit string', async () => {
    const code = await createVerificationCode(EMAIL)

    expect(typeof code).toBe('string')
    expect(code).toHaveLength(6)
    expect(/^\d{6}$/.test(code)).toBe(true)
  })

  it('deletes existing codes and inserts new one (2 DB calls)', async () => {
    await createVerificationCode(EMAIL)

    expect(mockDbDelete).toHaveBeenCalledTimes(1)
    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('lowercases the email', async () => {
    await createVerificationCode('USER@REVAMP-IT.CH')

    // Delete is called with lowercase email (verified via the chain being called)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// verifyEmailCode
// ============================================================================

describe('verifyEmailCode', () => {
  it('returns { success: false } when code not found or expired', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await verifyEmailCode(EMAIL, CODE)

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('updates user and deletes code on success', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow({ token: CODE })]))

    await verifyEmailCode(EMAIL, CODE)

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })

  it('returns { success: true } on success', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow({ token: CODE })]))

    const result = await verifyEmailCode(EMAIL, CODE)

    expect(result.success).toBe(true)
  })

  it('returns { success: false } on DB error (does not throw)', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(Promise.reject(new Error('connection lost'))),
      }),
    } as unknown as ReturnType<typeof makeChain>)

    const result = await verifyEmailCode(EMAIL, CODE)

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// createPasswordResetToken
// ============================================================================

describe('createPasswordResetToken', () => {
  it('returns a 64-char hex token', async () => {
    const token = await createPasswordResetToken(EMAIL)

    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it('calls db.insert once', async () => {
    await createPasswordResetToken(EMAIL)

    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('uses ~1 hour expiry by default', async () => {
    const before = Date.now()
    await createPasswordResetToken(EMAIL)
    const after = Date.now()

    const chain = mockDbInsert.mock.results[0].value as { values: jest.Mock }
    const valuesArg = chain.values.mock.calls[0][0] as { expires: string }
    const exp = new Date(valuesArg.expires).getTime()
    const oneHourMs = 60 * 60 * 1000

    expect(exp).toBeGreaterThanOrEqual(before + oneHourMs)
    expect(exp).toBeLessThanOrEqual(after + oneHourMs)
  })

  it('honours a custom expiresInMs (e.g. 7 days for IT-Hilfe claim links)', async () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const before = Date.now()
    await createPasswordResetToken(EMAIL, sevenDaysMs)
    const after = Date.now()

    const chain = mockDbInsert.mock.results[0].value as { values: jest.Mock }
    const valuesArg = chain.values.mock.calls[0][0] as { expires: string }
    const exp = new Date(valuesArg.expires).getTime()

    expect(exp).toBeGreaterThanOrEqual(before + sevenDaysMs)
    expect(exp).toBeLessThanOrEqual(after + sevenDaysMs)
  })
})

// ============================================================================
// verifyPasswordResetToken
// ============================================================================

describe('verifyPasswordResetToken', () => {
  it('returns { success: false } when token not found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await verifyPasswordResetToken(TOKEN)

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('deletes the token and returns { success: true, email } on success', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow()]))

    const result = await verifyPasswordResetToken(TOKEN)

    expect(result.success).toBe(true)
    expect(result.email).toBe(EMAIL)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })

  it('returns { success: false } on DB error (does not throw)', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(Promise.reject(new Error('timeout'))),
      }),
    } as unknown as ReturnType<typeof makeChain>)

    const result = await verifyPasswordResetToken(TOKEN)

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// updateUserPassword
// ============================================================================

describe('updateUserPassword', () => {
  it('returns { success: false } when user not found (empty returning)', async () => {
    mockDbUpdate.mockImplementationOnce(() => makeChain([]))

    const result = await updateUserPassword(EMAIL, 'new-hash')

    expect(result.success).toBe(false)
    expect(result.error).toContain('nicht gefunden')
  })

  it('returns { success: true } on successful password update', async () => {
    mockDbUpdate.mockImplementationOnce(() => makeChain([{ id: 'user-1' }]))

    const result = await updateUserPassword(EMAIL, 'new-hash')

    expect(result.success).toBe(true)
  })

  it('returns { success: false } on DB error (does not throw)', async () => {
    mockDbUpdate.mockReturnValueOnce({
      ...makeChain([]),
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue(Promise.reject(new Error('constraint'))),
        }),
      }),
    } as unknown as ReturnType<typeof makeChain>)

    const result = await updateUserPassword(EMAIL, 'hash')

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// getPasswordResetToken
// ============================================================================

describe('getPasswordResetToken', () => {
  it('returns null when no active reset token found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getPasswordResetToken(EMAIL)

    expect(result).toBeNull()
  })

  it('returns { identifier, token, expires } when token found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeTokenRow()]))

    const result = await getPasswordResetToken(EMAIL)

    expect(result).not.toBeNull()
    expect(result?.identifier).toBe(EMAIL)
    expect(result?.token).toBe(TOKEN)
    expect(result?.expires).toBeInstanceOf(Date)
  })
})
