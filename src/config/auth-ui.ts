/**
 * Auth UI constants (SSOT)
 *
 * Magic strings used across the registration/verification flow. Kept here
 * so a future rename doesn't require grep-and-pray across the auth tree.
 */

/**
 * localStorage key used to persist the in-progress registration state
 * (name, email, userId, emailVerified) so a page reload mid-wizard
 * doesn't lose progress. Password is NEVER persisted.
 */
export const REGISTRATION_STORAGE_KEY = 'revampit_registration_state'

/**
 * Fallback display name used in email templates + logs when the user
 * skipped the optional name field at signup. Same string is used by
 * register, verify-code, resend-code, and welcome-email paths.
 */
export const DEFAULT_USER_NAME_FALLBACK = 'Benutzer'

/**
 * Resend cooldown (seconds) — keeps users from hammering the resend
 * button. The server-side rate-limit is the real protection; this is
 * UI guardrails so the button doesn't appear available when it isn't.
 */
export const RESEND_CODE_COOLDOWN_SECONDS = 60

/**
 * Verification code length (digits). Single source of truth for both
 * the input UI and the validation schema.
 */
export const VERIFICATION_CODE_LENGTH = 6
