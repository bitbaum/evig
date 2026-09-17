import {
  isE2ETestAccountEmail,
  e2eTestAccountEmails,
  E2E_TEST_ACCOUNT_EMAILS_ENV,
} from '@/config/e2e-test-accounts';

// The list is no longer baked into the source, so the test supplies its own
// fixture addresses instead of asserting against whoever happens to be
// configured. Fictional on purpose: a test that names a real person's mailbox
// is the same leak the source file just stopped committing.
const FIXTURE = 'persona.one@example.com,Persona.Two@Example.org';

describe('e2e-test-accounts', () => {
  const original = process.env[E2E_TEST_ACCOUNT_EMAILS_ENV];

  afterEach(() => {
    if (original === undefined) delete process.env[E2E_TEST_ACCOUNT_EMAILS_ENV];
    else process.env[E2E_TEST_ACCOUNT_EMAILS_ENV] = original;
  });

  it('matches configured E2E emails case-insensitively', () => {
    process.env[E2E_TEST_ACCOUNT_EMAILS_ENV] = FIXTURE;

    expect(isE2ETestAccountEmail('persona.one@example.com')).toBe(true);
    expect(isE2ETestAccountEmail('Persona.One@Example.com')).toBe(true);
    expect(isE2ETestAccountEmail('persona.two@example.org')).toBe(true);
    expect(isE2ETestAccountEmail('random@example.com')).toBe(false);
    expect(isE2ETestAccountEmail(null)).toBe(false);
  });

  it('parses a comma-separated list, trimming blanks', () => {
    process.env[E2E_TEST_ACCOUNT_EMAILS_ENV] =
      ' persona.one@example.com , ,Persona.Two@Example.org ';

    expect(e2eTestAccountEmails()).toEqual(['persona.one@example.com', 'persona.two@example.org']);
  });

  // The whole point of the default: unset must RELAX NOTHING. If this ever
  // goes green with a non-empty list, some address is being trusted that
  // nobody configured.
  it('exempts nobody when the variable is unset', () => {
    delete process.env[E2E_TEST_ACCOUNT_EMAILS_ENV];

    expect(e2eTestAccountEmails()).toEqual([]);
    expect(isE2ETestAccountEmail('persona.one@example.com')).toBe(false);
  });

  it('exempts nobody when the variable is empty', () => {
    process.env[E2E_TEST_ACCOUNT_EMAILS_ENV] = '';

    expect(e2eTestAccountEmails()).toEqual([]);
    expect(isE2ETestAccountEmail('persona.one@example.com')).toBe(false);
  });
});
