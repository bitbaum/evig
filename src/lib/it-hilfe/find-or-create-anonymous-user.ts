/**
 * Find a user by email, or create a new one for an anonymous IT-Hilfe
 * request submission.
 *
 * This is the first slice of the "anonymous post + inline account
 * creation" feature on the roadmap. A logged-out visitor submitting a
 * repair request supplies their email; this helper either matches them
 * to an existing account (if the email is known) or provisions a new
 * unclaimed account that they can later activate via a password-reset
 * link.
 *
 * Newly-created users:
 *   - `passwordHash: null` (claim flow sets it via the existing
 *     forgot-password / set-password infrastructure)
 *   - `emailVerified: null` (proven only when the user clicks the
 *     claim link sent to that address)
 *   - `role: 'user'`, `isStaff: false`
 *
 * Email is trimmed + lowercased before lookup or insert so that
 * "  Foo@Bar.com " and "foo@bar.com" resolve to the same account.
 *
 * Callers are responsible for the downstream behavior:
 *   - Existing user (`wasCreated: false`): the caller may still want
 *     to send a "we're attaching this request to your account, sign
 *     in to view it" email — but no claim flow is needed because the
 *     user already has a password.
 *   - New user (`wasCreated: true`): the caller MUST send a claim
 *     email with a password-reset token; otherwise the user can never
 *     access the request they just submitted.
 */

import { getUserByEmail, createUser } from '@/lib/auth/db'

export interface FindOrCreateResult {
  userId: string
  wasCreated: boolean
}

// Basic RFC-5322-ish check. Real validation happens at the schema layer
// upstream; this is a defensive guard so we don't insert junk into the
// users table.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export async function findOrCreateAnonymousUser(rawEmail: string): Promise<FindOrCreateResult> {
  const email = normaliseEmail(rawEmail)
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email')
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    return { userId: existing.id, wasCreated: false }
  }

  const created = await createUser({ email })
  return { userId: created.id, wasCreated: true }
}
