/**
 * Error utility functions
 *
 * Client-safe helpers for error handling.
 * Created: 2026-02-09
 */

/**
 * Extract a user-friendly error message from an unknown error.
 * Safe for both client and server components.
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unbekannter Fehler';
}
