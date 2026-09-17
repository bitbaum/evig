/**
 * Known E2E test accounts (prod dual-persona smoke).
 * Used to relax rate limits during automated inventory runs — not a security bypass for real users.
 *
 * The list is CONFIGURATION, not code: it used to be two personal addresses
 * hardcoded in a shipped source file, so the repo published who they were and
 * the only way to change them was a release. It now comes from
 * `E2E_TEST_ACCOUNT_EMAILS` (comma-separated), and the default is EMPTY.
 *
 * Empty is the safe direction. The list only ever RELAXES a rate limit, so an
 * unset variable means "nobody is exempt" — the strict path everyone else
 * already takes. A baked-in default would mean the opposite: an address nobody
 * configured being trusted on every deployment of this code.
 *
 * Server-only on purpose — never NEXT_PUBLIC_, or the addresses ship to the
 * browser bundle, which is the leak this change exists to close.
 */

export const E2E_TEST_ACCOUNT_EMAILS_ENV = 'E2E_TEST_ACCOUNT_EMAILS';

/**
 * Read at call time, not at module load: the value is only ever consulted
 * inside a request, and reading it lazily keeps the function honest in a
 * process whose env is populated after this module is imported.
 */
export function e2eTestAccountEmails(): string[] {
  return (process.env[E2E_TEST_ACCOUNT_EMAILS_ENV] ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isE2ETestAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return e2eTestAccountEmails().includes(normalized);
}
