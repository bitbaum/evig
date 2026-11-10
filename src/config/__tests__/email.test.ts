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
 *   - returns 'resend' when LISTMONK_ENABLED is not set (there is no SMTP fallback)
 *
 *   isEmailConfigured
 *   - returns true when LISTMONK_ENABLED=true
 *   - returns true when RESEND_API_KEY is set
 *   - returns false when neither is configured
 *
 *   validateEmailConfig
 *   - throws when Resend is used without RESEND_API_KEY
 *   - does not throw when listmonk is enabled
 */

// Email config reads env at module load time but uses process.env at call time
// We control the env around each test via beforeEach/afterEach.

vi.mock('@/config/org', () => ({
  ORG: {
    name: 'Revamp-IT',
    emailDomain: 'revamp-it.ch',
  },
}));

// Helper to isolate env vars for each test
async function withEnv(vars: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key];
    if (vars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = vars[key];
    }
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
}

// Reset module registry so email.ts re-evaluates with each describe block env
// (module-level constants capture env at import time, but the functions read
// process.env at call time, so we only need vi.resetModules for constants)

describe('getEmailProvider', () => {
  it('returns "resend" when LISTMONK_ENABLED is not set', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: undefined, RESEND_API_KEY: undefined }, async () => {
      const { getEmailProvider } = (await import('../email')) as any;
      expect(getEmailProvider()).toBe('resend');
    });
  });

  it('returns "listmonk" when LISTMONK_ENABLED=true', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: 'true' }, async () => {
      const { getEmailProvider } = (await import('../email')) as any;
      expect(getEmailProvider()).toBe('listmonk');
    });
  });

  it('returns "resend" when LISTMONK_ENABLED=false', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: 'false' }, async () => {
      const { getEmailProvider } = (await import('../email')) as any;
      expect(getEmailProvider()).toBe('resend');
    });
  });

  it('never answers "smtp", even with the old SMTP variables set', async () => {
    vi.resetModules();
    await withEnv(
      { LISTMONK_ENABLED: undefined, RESEND_API_KEY: undefined, EMAIL_USER: 'u', EMAIL_PASS: 'p' },
      async () => {
        const { getEmailProvider, isEmailConfigured } = (await import('../email')) as any;
        expect(getEmailProvider()).toBe('resend');
        expect(isEmailConfigured()).toBe(false);
      },
    );
  });
});

describe('isEmailConfigured', () => {
  it('returns true when LISTMONK_ENABLED=true', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: 'true', RESEND_API_KEY: undefined }, async () => {
      const { isEmailConfigured } = (await import('../email')) as any;
      expect(isEmailConfigured()).toBe(true);
    });
  });

  it('returns true when RESEND_API_KEY is set', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: undefined, RESEND_API_KEY: 're_test' }, async () => {
      const { isEmailConfigured } = (await import('../email')) as any;
      expect(isEmailConfigured()).toBe(true);
    });
  });

  it('returns false when neither Listmonk nor Resend is set', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: undefined, RESEND_API_KEY: undefined }, async () => {
      const { isEmailConfigured } = (await import('../email')) as any;
      expect(isEmailConfigured()).toBe(false);
    });
  });
});

describe('validateEmailConfig', () => {
  it('throws when Resend is used without RESEND_API_KEY', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: undefined, RESEND_API_KEY: undefined }, async () => {
      const { validateEmailConfig } = (await import('../email')) as any;
      expect(() => validateEmailConfig()).toThrow(/RESEND_API_KEY/);
    });
  });

  it('does not throw when RESEND_API_KEY is set', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: undefined, RESEND_API_KEY: 're_test' }, async () => {
      const { validateEmailConfig } = (await import('../email')) as any;
      expect(() => validateEmailConfig()).not.toThrow();
    });
  });

  it('does not throw when LISTMONK_ENABLED=true', async () => {
    vi.resetModules();
    await withEnv({ LISTMONK_ENABLED: 'true' }, async () => {
      const { validateEmailConfig } = (await import('../email')) as any;
      expect(() => validateEmailConfig()).not.toThrow();
    });
  });
});
