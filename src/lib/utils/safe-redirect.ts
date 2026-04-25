/**
 * Sanitize a user-controlled redirect target.
 *
 * Rejects anything that could leave the origin:
 * - absolute URLs (`https://evil.com`, `mailto:`, `javascript:`, `data:`)
 * - protocol-relative (`//evil.com`)
 * - backslash variants browsers normalize to `/` (`/\evil.com`, `\\evil.com`)
 * - control characters (CR/LF/TAB) used to bypass naive prefix checks
 * - paths that don't start with a single `/`
 *
 * Returns the input when safe, otherwise the supplied fallback.
 */
export function sanitizeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value || typeof value !== 'string') return fallback

  // Reject control characters (\r, \n, \t, NUL) — used in header-injection-style bypasses
  if (/[\x00-\x1f]/.test(value)) return fallback

  // Must start with a single forward slash
  if (!value.startsWith('/')) return fallback

  // Reject `//evil.com` (protocol-relative) and `/\evil.com` (browser normalises \ → /)
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback

  return value
}
