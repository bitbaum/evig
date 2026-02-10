/**
 * Tests for password.ts
 *
 * Tests password hashing, verification, token generation,
 * constant-time comparison, and password strength validation.
 */

// Mock AUTH_CONFIG for password strength validation
jest.mock('@/lib/auth/config', () => ({
  AUTH_CONFIG: {
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      specialChars: '!@#$%^&*(),.?":{}|<>[]\\;\'`~_+-=',
    },
  },
}))

import {
  hashPassword,
  verifyPassword,
  constantTimeCompare,
  generateToken,
  validatePasswordStrength,
} from '../password'

// ============================================================================
// hashPassword + verifyPassword
// ============================================================================

describe('hashPassword', () => {
  it('produces a bcrypt hash', async () => {
    const hash = await hashPassword('TestPassword123')
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
  })

  it('produces different hashes for same password', async () => {
    const hash1 = await hashPassword('SamePassword')
    const hash2 = await hashPassword('SamePassword')
    expect(hash1).not.toBe(hash2) // Different salts
  })
})

describe('verifyPassword', () => {
  it('verifies correct password', async () => {
    const hash = await hashPassword('CorrectPassword')
    expect(await verifyPassword('CorrectPassword', hash)).toBe(true)
  })

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword')
    expect(await verifyPassword('WrongPassword', hash)).toBe(false)
  })

  it('handles empty password', async () => {
    const hash = await hashPassword('SomePassword')
    expect(await verifyPassword('', hash)).toBe(false)
  })
})

// ============================================================================
// constantTimeCompare
// ============================================================================

describe('constantTimeCompare', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeCompare('abc', 'abc')).toBe(true)
    expect(constantTimeCompare('', '')).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(constantTimeCompare('abc', 'def')).toBe(false)
    expect(constantTimeCompare('abc', 'abcd')).toBe(false)
  })

  it('returns false for different lengths', () => {
    expect(constantTimeCompare('short', 'longer-string')).toBe(false)
  })
})

// ============================================================================
// generateToken
// ============================================================================

describe('generateToken', () => {
  it('generates a token of default length', () => {
    const token = generateToken()
    expect(token.length).toBe(32)
  })

  it('generates a token of custom length', () => {
    const token = generateToken(64)
    expect(token.length).toBe(64)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })

  it('only contains alphanumeric characters', () => {
    const token = generateToken(100)
    expect(token).toMatch(/^[A-Za-z0-9]+$/)
  })
})

// ============================================================================
// validatePasswordStrength
// ============================================================================

describe('validatePasswordStrength', () => {
  it('accepts valid password (meets minimum length)', () => {
    const result = validatePasswordStrength('abcdefgh') // 8 chars
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects password shorter than minLength', () => {
    const result = validatePasswordStrength('short')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('8')
  })

  it('rejects password exceeding maxLength', () => {
    const longPassword = 'a'.repeat(129)
    const result = validatePasswordStrength(longPassword)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('128')
  })

  it('accepts any character combination when no requirements', () => {
    // With all require* flags off, only length matters
    expect(validatePasswordStrength('12345678').isValid).toBe(true)
    expect(validatePasswordStrength('abcdefgh').isValid).toBe(true)
    expect(validatePasswordStrength('ABCDEFGH').isValid).toBe(true)
    expect(validatePasswordStrength('!@#$%^&*').isValid).toBe(true)
  })
})
