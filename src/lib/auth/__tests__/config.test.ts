/**
 * Tests for auth configuration helpers (lib/auth/config.ts).
 *
 * These guard the security boundary — a wrong default here lets weak
 * secrets in or weakens role enforcement. The functions either throw
 * loud (preferred) or downgrade gracefully (build-time placeholder).
 * Each branch is locked by a test.
 */

import {
  getRequiredEnv,
  getOptionalEnv,
  getJwtSecret,
  getAuthSecret,
  getDbConfig,
  hasMinimumRole,
  validateAdminPasswordConfig,
  AUTH_CONFIG,
  UNIFIED_ROLES,
  ROLE_HIERARCHY,
} from '../config'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  // Reset to a known empty state so individual tests opt into env vars.
  process.env = { ...ORIGINAL_ENV }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

// ============================================================================
// getRequiredEnv / getOptionalEnv
// ============================================================================

describe('getRequiredEnv', () => {
  it('returns the value when env var is set', () => {
    process.env.TEST_ENV = 'hello'
    expect(getRequiredEnv('TEST_ENV')).toBe('hello')
  })

  it('throws a descriptive error when env var is missing', () => {
    delete process.env.TEST_MISSING
    expect(() => getRequiredEnv('TEST_MISSING')).toThrow(/TEST_MISSING is not set/)
  })

  it('treats empty string as missing', () => {
    process.env.TEST_EMPTY = ''
    expect(() => getRequiredEnv('TEST_EMPTY')).toThrow(/TEST_EMPTY is not set/)
  })
})

describe('getOptionalEnv', () => {
  it('returns the value when env var is set', () => {
    process.env.TEST_OPT = 'set-value'
    expect(getOptionalEnv('TEST_OPT', 'fallback')).toBe('set-value')
  })

  it('returns the fallback when env var is missing', () => {
    delete process.env.TEST_OPT_MISSING
    expect(getOptionalEnv('TEST_OPT_MISSING', 'fallback')).toBe('fallback')
  })

  it('returns the fallback when env var is empty string', () => {
    process.env.TEST_OPT_EMPTY = ''
    expect(getOptionalEnv('TEST_OPT_EMPTY', 'fallback')).toBe('fallback')
  })
})

// ============================================================================
// getJwtSecret
// ============================================================================

describe('getJwtSecret', () => {
  it('returns the secret when set and ≥32 chars', () => {
    process.env.JWT_SECRET = 'a'.repeat(32)
    expect(getJwtSecret()).toBe('a'.repeat(32))
  })

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/)
  })

  it('throws when secret is shorter than 32 chars (security floor)', () => {
    process.env.JWT_SECRET = 'a'.repeat(31)
    expect(() => getJwtSecret()).toThrow(/at least 32 characters/)
  })

  it('accepts a secret at exactly 32 chars (boundary)', () => {
    process.env.JWT_SECRET = 'b'.repeat(32)
    expect(() => getJwtSecret()).not.toThrow()
  })

  it('accepts a long secret', () => {
    process.env.JWT_SECRET = 'c'.repeat(128)
    expect(getJwtSecret()).toHaveLength(128)
  })
})

// ============================================================================
// getAuthSecret
// ============================================================================

describe('getAuthSecret', () => {
  it('returns AUTH_SECRET when set', () => {
    process.env.AUTH_SECRET = 'my-secret'
    delete process.env.NEXTAUTH_SECRET
    expect(getAuthSecret()).toBe('my-secret')
  })

  it('falls back to NEXTAUTH_SECRET when AUTH_SECRET missing', () => {
    delete process.env.AUTH_SECRET
    process.env.NEXTAUTH_SECRET = 'legacy-secret'
    expect(getAuthSecret()).toBe('legacy-secret')
  })

  it('prefers AUTH_SECRET over NEXTAUTH_SECRET when both set', () => {
    process.env.AUTH_SECRET = 'new-secret'
    process.env.NEXTAUTH_SECRET = 'old-secret'
    expect(getAuthSecret()).toBe('new-secret')
  })

  it('throws when both are missing', () => {
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET environment variable is required/)
  })
})

// ============================================================================
// getDbConfig
// ============================================================================

describe('getDbConfig', () => {
  beforeEach(() => {
    delete process.env.DB_HOST
    delete process.env.DB_NAME
    delete process.env.DB_USER
    delete process.env.DB_PASSWORD
    delete process.env.AUTH_DB_HOST
    delete process.env.AUTH_DB_NAME
    delete process.env.AUTH_DB_USER
    delete process.env.AUTH_DB_PASSWORD
    ;(process.env as Record<string, string>).NODE_ENV = 'test'
  })

  it('returns a placeholder config when DB env vars are absent (non-production)', () => {
    const config = getDbConfig()
    expect(config.host).toBe('localhost')
    expect(config.database).toBe('placeholder')
    expect(config.max).toBe(1) // small pool — never actually connects
  })

  it('returns placeholder during build (NEXT_PHASE set, even in production)', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.NEXT_PHASE = 'phase-production-build'
    const config = getDbConfig()
    expect(config.database).toBe('placeholder')
    delete process.env.NEXT_PHASE
  })

  it('throws in production when DB env vars are missing and not building', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    delete process.env.NEXT_PHASE
    expect(() => getDbConfig()).toThrow(/Missing required database config/)
  })

  it('returns real config when all DB env vars are set', () => {
    process.env.DB_HOST = 'db.example.com'
    process.env.DB_NAME = 'revamp'
    process.env.DB_USER = 'app'
    process.env.DB_PASSWORD = 'secret'
    const config = getDbConfig()
    expect(config.host).toBe('db.example.com')
    expect(config.database).toBe('revamp')
    expect(config.max).toBe(20) // production pool size
  })

  it('AUTH_DB_* prefix overrides DB_* (auth-specific connection)', () => {
    process.env.DB_HOST = 'shared.example.com'
    process.env.DB_NAME = 'shared-db'
    process.env.DB_USER = 'shared-user'
    process.env.DB_PASSWORD = 'shared-pw'
    process.env.AUTH_DB_HOST = 'auth.example.com'
    process.env.AUTH_DB_NAME = 'auth-db'
    process.env.AUTH_DB_USER = 'auth-user'
    process.env.AUTH_DB_PASSWORD = 'auth-pw'
    const config = getDbConfig()
    expect(config.host).toBe('auth.example.com')
    expect(config.database).toBe('auth-db')
    expect(config.user).toBe('auth-user')
    expect(config.password).toBe('auth-pw')
  })

  it('disables SSL when DB_SSL=false', () => {
    process.env.DB_HOST = 'h'
    process.env.DB_NAME = 'd'
    process.env.DB_USER = 'u'
    process.env.DB_PASSWORD = 'p'
    process.env.DB_SSL = 'false'
    expect(getDbConfig().ssl).toBe(false)
  })

  it('enables SSL by default when DB_SSL is unset', () => {
    process.env.DB_HOST = 'h'
    process.env.DB_NAME = 'd'
    process.env.DB_USER = 'u'
    process.env.DB_PASSWORD = 'p'
    delete process.env.DB_SSL
    expect(getDbConfig().ssl).toEqual({ rejectUnauthorized: false })
  })
})

// ============================================================================
// hasMinimumRole
// ============================================================================

describe('hasMinimumRole', () => {
  it('returns true when user role exactly matches required', () => {
    expect(hasMinimumRole(UNIFIED_ROLES.EMPLOYEE, UNIFIED_ROLES.EMPLOYEE)).toBe(true)
  })

  it('returns true when user role outranks required', () => {
    expect(hasMinimumRole(UNIFIED_ROLES.SUPER_ADMIN, UNIFIED_ROLES.USER)).toBe(true)
    expect(hasMinimumRole(UNIFIED_ROLES.ADMIN, UNIFIED_ROLES.EMPLOYEE)).toBe(true)
  })

  it('returns false when user role is below required', () => {
    expect(hasMinimumRole(UNIFIED_ROLES.USER, UNIFIED_ROLES.ADMIN)).toBe(false)
    expect(hasMinimumRole(UNIFIED_ROLES.SUPPORTER, UNIFIED_ROLES.EDITOR)).toBe(false)
  })

  it('hierarchy is ordered low → high (USER lowest, SUPER_ADMIN highest)', () => {
    expect(ROLE_HIERARCHY[0]).toBe(UNIFIED_ROLES.USER)
    expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe(UNIFIED_ROLES.SUPER_ADMIN)
  })
})

// ============================================================================
// validateAdminPasswordConfig
// ============================================================================

describe('validateAdminPasswordConfig', () => {
  beforeEach(() => {
    delete process.env.ADMIN_PASSWORD
    delete process.env.ADMIN_PASSWORD_HASH
    ;(process.env as Record<string, string>).NODE_ENV = 'test'
  })

  it('accepts a valid bcrypt hash ($2b$...)', () => {
    process.env.ADMIN_PASSWORD_HASH = '$2b$12$' + 'x'.repeat(53)
    const result = validateAdminPasswordConfig()
    expect(result.valid).toBe(true)
  })

  it('accepts $2a$ and $2y$ bcrypt variants', () => {
    process.env.ADMIN_PASSWORD_HASH = '$2a$12$' + 'x'.repeat(53)
    expect(validateAdminPasswordConfig().valid).toBe(true)
    process.env.ADMIN_PASSWORD_HASH = '$2y$12$' + 'x'.repeat(53)
    expect(validateAdminPasswordConfig().valid).toBe(true)
  })

  it('rejects a non-bcrypt hash string with descriptive error', () => {
    process.env.ADMIN_PASSWORD_HASH = 'plain-text-trying-to-look-like-a-hash'
    const result = validateAdminPasswordConfig()
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/bcrypt hash/)
  })

  it('rejects when neither hash nor plain password is set', () => {
    const result = validateAdminPasswordConfig()
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD/)
  })

  it('blocks plain ADMIN_PASSWORD in production (security policy)', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    process.env.ADMIN_PASSWORD = 'plaintext-pw'
    const result = validateAdminPasswordConfig()
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/SECURITY ERROR/)
    expect(result.error).toMatch(/not allowed in production/)
  })

  it('allows plain ADMIN_PASSWORD in development with a warning', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    process.env.ADMIN_PASSWORD = 'plaintext-pw'
    const result = validateAdminPasswordConfig()
    expect(result.valid).toBe(true)
    expect(result.warning).toMatch(/SECURITY WARNING/)
  })
})

// ============================================================================
// AUTH_CONFIG constants — lock the security floor
// ============================================================================

describe('AUTH_CONFIG security floor', () => {
  it('uses bcrypt salt rounds ≥ 10 (OWASP minimum)', () => {
    expect(AUTH_CONFIG.bcrypt.saltRounds).toBeGreaterThanOrEqual(10)
  })

  it('keeps password minLength at exactly 8 (matches forms + reset flow)', () => {
    expect(AUTH_CONFIG.password.minLength).toBe(8)
  })

  it('caps password maxLength to prevent bcrypt-DoS via long inputs', () => {
    expect(AUTH_CONFIG.password.maxLength).toBeLessThanOrEqual(128)
  })

  it('login lockout block ≥ 30 minutes after maxAttempts (5)', () => {
    expect(AUTH_CONFIG.rateLimit.login.maxAttempts).toBe(5)
    expect(AUTH_CONFIG.rateLimit.login.blockDuration).toBeGreaterThanOrEqual(30 * 60 * 1000)
  })

  it('cookies are httpOnly + sameSite=strict', () => {
    expect(AUTH_CONFIG.cookies.httpOnly).toBe(true)
    expect(AUTH_CONFIG.cookies.sameSite).toBe('strict')
  })

  it('JWT uses HS256', () => {
    expect(AUTH_CONFIG.jwt.algorithm).toBe('HS256')
  })

  it('emailVerification token TTL is 24h, passwordReset is 1h', () => {
    expect(AUTH_CONFIG.tokens.emailVerification).toBe(24 * 60 * 60 * 1000)
    expect(AUTH_CONFIG.tokens.passwordReset).toBe(60 * 60 * 1000)
  })
})
