/**
 * Tests for config/email.ts — email provider configuration helpers.
 *
 * Mission-relevant: Revamp-IT sends transactional emails (booking confirmations,
 * auth links). If getEmailProvider() returns 'listmonk' when LISTMONK is not
 * configured, emails silently fail. If isEmailConfigured() returns true when
 * no SMTP credentials exist, email sends fail at runtime with no early warning.
 *
 * Behaviors locked:
 *   getEmailProvider
 *   - returns 'listmonk' when LISTMONK_ENABLED=true
 *   - returns 'smtp' when LISTMONK_ENABLED is not set
 *
 *   isEmailConfigured
 *   - returns true when LISTMONK_ENABLED=true
 *   - returns true when EMAIL_USER and EMAIL_PASS are set
 *   - returns false when neither is configured
 *
 *   validateEmailConfig
 *   - throws when SMTP is used without EMAIL_USER
 *   - throws when SMTP is used without EMAIL_PASS
 *   - does not throw when listmonk is enabled
 */

// Email config reads env at module load time but uses process.env at call time
// We control the env around each test via beforeEach/afterEach.

jest.mock('@/config/org', () => ({
  ORG: {
    name: 'Revamp-IT',
    emailDomain: 'revamp-it.ch',
  },
}))

// Helper to isolate env vars for each test
function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {}
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key]
    if (vars[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = vars[key]
    }
  }
  try {
    fn()
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = saved[key]
      }
    }
  }
}

// Reset module registry so email.ts re-evaluates with each describe block env
// (module-level constants capture env at import time, but the functions read
// process.env at call time, so we only need jest.resetModules for constants)

describe('getEmailProvider', () => {
  it('returns "smtp" when LISTMONK_ENABLED is not set', () => {
    // Import fresh in each test to avoid cross-contamination
    jest.resetModules()
    withEnv({ LISTMONK_ENABLED: undefined }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEmailProvider } = require('../email')
      expect(getEmailProvider()).toBe('smtp')
    })
  })

  it('returns "listmonk" when LISTMONK_ENABLED=true', () => {
    jest.resetModules()
    withEnv({ LISTMONK_ENABLED: 'true' }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEmailProvider } = require('../email')
      expect(getEmailProvider()).toBe('listmonk')
    })
  })

  it('returns "smtp" when LISTMONK_ENABLED=false', () => {
    jest.resetModules()
    withEnv({ LISTMONK_ENABLED: 'false' }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEmailProvider } = require('../email')
      expect(getEmailProvider()).toBe('smtp')
    })
  })
})

describe('isEmailConfigured', () => {
  it('returns true when LISTMONK_ENABLED=true', () => {
    jest.resetModules()
    withEnv({ LISTMONK_ENABLED: 'true' }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isEmailConfigured } = require('../email')
      expect(isEmailConfigured()).toBe(true)
    })
  })

  it('returns true when EMAIL_USER and EMAIL_PASS are both set', () => {
    jest.resetModules()
    withEnv({
      LISTMONK_ENABLED: undefined,
      EMAIL_USER: 'test@example.com',
      EMAIL_PASS: 'secret',
    }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isEmailConfigured } = require('../email')
      expect(isEmailConfigured()).toBe(true)
    })
  })

  it('returns false when neither listmonk nor SMTP credentials are set', () => {
    jest.resetModules()
    withEnv({
      LISTMONK_ENABLED: undefined,
      EMAIL_USER: undefined,
      EMAIL_PASS: undefined,
    }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isEmailConfigured } = require('../email')
      expect(isEmailConfigured()).toBe(false)
    })
  })
})

describe('validateEmailConfig', () => {
  it('throws when SMTP is used without EMAIL_USER', () => {
    jest.resetModules()
    withEnv({
      LISTMONK_ENABLED: undefined,
      EMAIL_USER: undefined,
      EMAIL_PASS: 'secret',
    }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateEmailConfig } = require('../email')
      expect(() => validateEmailConfig()).toThrow(/EMAIL_USER/)
    })
  })

  it('throws when SMTP is used without EMAIL_PASS', () => {
    jest.resetModules()
    withEnv({
      LISTMONK_ENABLED: undefined,
      EMAIL_USER: 'test@example.com',
      EMAIL_PASS: undefined,
    }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateEmailConfig } = require('../email')
      expect(() => validateEmailConfig()).toThrow(/EMAIL_PASS/)
    })
  })

  it('does not throw when LISTMONK_ENABLED=true', () => {
    jest.resetModules()
    withEnv({ LISTMONK_ENABLED: 'true' }, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validateEmailConfig } = require('../email')
      expect(() => validateEmailConfig()).not.toThrow()
    })
  })
})
