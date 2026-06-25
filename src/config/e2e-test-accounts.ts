/**
 * Known E2E test accounts (prod dual-persona smoke).
 * Used to relax rate limits during automated inventory runs — not a security bypass for real users.
 */

export const E2E_TEST_ACCOUNT_EMAILS = [
  'butaeff@gmail.com',
  'georgy.butaev@revamp-it.ch',
] as const

export function isE2ETestAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.toLowerCase()
  return E2E_TEST_ACCOUNT_EMAILS.some((e) => e.toLowerCase() === normalized)
}
