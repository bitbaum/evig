/**
 * Tests for password.ts
 *
 * Tests password hashing, verification, token generation,
 * constant-time comparison, and password strength validation.
 */

// Mock AUTH_CONFIG for password strength validation
vi.mock('@/lib/auth/config', () => ({
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
}));

import type { Mock } from 'vitest';
import { hashPassword, verifyPassword, constantTimeCompare, generateToken } from '../password';

// ============================================================================
// hashPassword + verifyPassword
// ============================================================================

describe('hashPassword', () => {
  it('produces a bcrypt hash', async () => {
    const hash = await hashPassword('TestPassword123');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('produces different hashes for same password', async () => {
    const hash1 = await hashPassword('SamePassword');
    const hash2 = await hashPassword('SamePassword');
    expect(hash1).not.toBe(hash2); // Different salts
  });
});

describe('verifyPassword', () => {
  it('verifies correct password', async () => {
    const hash = await hashPassword('CorrectPassword');
    expect(await verifyPassword('CorrectPassword', hash)).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword');
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('handles empty password', async () => {
    const hash = await hashPassword('SomePassword');
    expect(await verifyPassword('', hash)).toBe(false);
  });
});

// ============================================================================
// constantTimeCompare
// ============================================================================

describe('constantTimeCompare', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeCompare('abc', 'abc')).toBe(true);
    expect(constantTimeCompare('', '')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(constantTimeCompare('abc', 'def')).toBe(false);
    expect(constantTimeCompare('abc', 'abcd')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(constantTimeCompare('short', 'longer-string')).toBe(false);
  });
});

// ============================================================================
// generateToken
// ============================================================================

describe('generateToken', () => {
  it('generates a token of default length', () => {
    const token = generateToken();
    expect(token.length).toBe(32);
  });

  it('generates a token of custom length', () => {
    const token = generateToken(64);
    expect(token.length).toBe(64);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });

  it('only contains alphanumeric characters', () => {
    const token = generateToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });
});
