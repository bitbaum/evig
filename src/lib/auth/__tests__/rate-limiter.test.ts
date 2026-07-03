/**
 * Tests for rate-limiter.ts
 *
 * Tests rate limiting, account lockout, client IP extraction,
 * and rate limit key creation.
 */

// Mock dependencies before imports
jest.mock('@/db', () => ({
  db: {
    execute: jest.fn(),
    select: jest.fn(),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    })),
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import {
  checkRateLimit,
  resetRateLimit,
  recordFailedAttempt,
  isAccountLocked,
  resetLockout,
  clearFailedAttempts,
  isAccountLockedDb,
  getClientIp,
  createRateLimitKey,
} from '../rate-limiter'

const mockDb = jest.requireMock('@/db').db as {
  select: jest.Mock
}

// ============================================================================
// getClientIp
// ============================================================================

describe('getClientIp', () => {
  it('extracts from x-forwarded-for (first IP)', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8')
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('extracts from x-real-ip', () => {
    const headers = new Headers()
    headers.set('x-real-ip', '10.0.0.1')
    expect(getClientIp(headers)).toBe('10.0.0.1')
  })

  it('extracts from cf-connecting-ip', () => {
    const headers = new Headers()
    headers.set('cf-connecting-ip', '192.168.1.1')
    expect(getClientIp(headers)).toBe('192.168.1.1')
  })

  it('returns "unknown" when no IP headers present', () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '1.1.1.1')
    headers.set('x-real-ip', '2.2.2.2')
    expect(getClientIp(headers)).toBe('1.1.1.1')
  })
})

// ============================================================================
// createRateLimitKey
// ============================================================================

describe('createRateLimitKey', () => {
  it('returns IP-only key when no email', () => {
    expect(createRateLimitKey('1.2.3.4')).toBe('1.2.3.4')
  })

  it('combines IP and lowercase email', () => {
    expect(createRateLimitKey('1.2.3.4', 'User@Example.com')).toBe('1.2.3.4:user@example.com')
  })
})

// ============================================================================
// checkRateLimit
// ============================================================================

describe('checkRateLimit', () => {
  // Use unique identifiers per test to avoid cross-test pollution
  let testId = 0
  const getUniqueId = () => `rate-test-${++testId}-${Date.now()}`

  it('allows first request', () => {
    const id = getUniqueId()
    const result = checkRateLimit(id, 'login')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it('allows multiple requests within limit', () => {
    const id = getUniqueId()
    // Login allows 5 attempts
    for (let i = 0; i < 4; i++) {
      const result = checkRateLimit(id, 'login')
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks after exceeding max attempts', () => {
    const id = getUniqueId()
    // Login allows 5 attempts per 15-min window
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, 'login')
    }
    const blocked = checkRateLimit(id, 'login')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('provides retryAfter when blocked', () => {
    const id = getUniqueId()
    for (let i = 0; i < 6; i++) {
      checkRateLimit(id, 'login')
    }
    const blocked = checkRateLimit(id, 'login')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('resets after calling resetRateLimit', () => {
    const id = getUniqueId()
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, 'login')
    }
    resetRateLimit(id, 'login')
    const result = checkRateLimit(id, 'login')
    expect(result.allowed).toBe(true)
  })

  it('works with different rate limit types', () => {
    const id = getUniqueId()
    // passwordReset has 3 max attempts
    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, 'passwordReset')
    }
    const blocked = checkRateLimit(id, 'passwordReset')
    expect(blocked.allowed).toBe(false)
  })
})

// ============================================================================
// Account Lockout
// ============================================================================

describe('recordFailedAttempt', () => {
  let testId = 0
  const getUniqueId = () => `lockout-test-${++testId}-${Date.now()}`

  it('tracks failed attempts', () => {
    const id = getUniqueId()
    const result = recordFailedAttempt(id)
    expect(result.locked).toBe(false)
    expect(result.remainingAttempts).toBe(4) // 5 max - 1 attempt
  })

  it('locks account after max failed attempts', () => {
    const id = getUniqueId()
    let result
    for (let i = 0; i < 5; i++) {
      result = recordFailedAttempt(id)
    }
    expect(result!.locked).toBe(true)
    expect(result!.remainingAttempts).toBe(0)
    expect(result!.retryAfter).toBeGreaterThan(0)
  })

  it('keeps account locked on subsequent attempts', () => {
    const id = getUniqueId()
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id)
    }
    // Attempt again while locked
    const result = recordFailedAttempt(id)
    expect(result.locked).toBe(true)
  })
})

describe('isAccountLocked', () => {
  let testId = 0
  const getUniqueId = () => `locked-test-${++testId}-${Date.now()}`

  it('returns not locked for unknown identifier', () => {
    const result = isAccountLocked(getUniqueId())
    expect(result.locked).toBe(false)
    expect(result.remainingAttempts).toBe(5)
  })

  it('returns locked after max failures', () => {
    const id = getUniqueId()
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id)
    }
    const result = isAccountLocked(id)
    expect(result.locked).toBe(true)
  })
})

describe('resetLockout', () => {
  it('clears lockout state', () => {
    const id = `reset-lockout-${Date.now()}`
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id)
    }
    expect(isAccountLocked(id).locked).toBe(true)

    resetLockout(id)
    expect(isAccountLocked(id).locked).toBe(false)
  })
})

describe('clearFailedAttempts', () => {
  it('resets failed attempt count without removing entry', () => {
    const id = `clear-attempts-${Date.now()}`
    for (let i = 0; i < 3; i++) {
      recordFailedAttempt(id)
    }
    clearFailedAttempts(id)
    const result = isAccountLocked(id)
    expect(result.locked).toBe(false)
    expect(result.remainingAttempts).toBe(5)
  })
})

describe('isAccountLockedDb', () => {
  function mockLockoutRows(rows: unknown[]) {
    const limit = jest.fn().mockResolvedValue(rows)
    const where = jest.fn(() => ({ limit }))
    const from = jest.fn(() => ({ where }))
    mockDb.select.mockReturnValue({ from })
    return { from, where, limit }
  }

  beforeEach(() => {
    mockDb.select.mockReset()
  })

  it('returns unlocked when no persistent lockout row exists', async () => {
    mockLockoutRows([])

    const result = await isAccountLockedDb('user-1')

    expect(result).toEqual({ locked: false, remainingAttempts: 5 })
  })

  it('returns locked when locked_until is in the future', async () => {
    const lockedUntil = new Date(Date.now() + 60_000).toISOString()
    mockLockoutRows([{ failedAttempts: 5, lockedUntil }])

    const result = await isAccountLockedDb('user-1')

    expect(result.locked).toBe(true)
    expect(result.remainingAttempts).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('falls back to in-memory lockout if the DB read fails', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('db unavailable')
    })

    const id = 'user-fallback'
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(`${id}:login`)
    }

    const result = await isAccountLockedDb(id)

    expect(result.locked).toBe(true)
  })
})
