/**
 * Shared date formatting utilities.
 */

/** Formats a deadline as relative time (e.g. "3d", "12h", "Abgelaufen"). */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '–';
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs < 0) return 'Abgelaufen';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Today's date in the local timezone, formatted as YYYY-MM-DD (the format
 * HTML <input type="date"> expects for its value and min/max attributes).
 *
 * Use this instead of `new Date().toISOString().split('T')[0]` for any
 * client-side date-picker default or `min` constraint. The toISOString
 * variant returns UTC's today — for a user in Zurich (UTC+1 winter /
 * UTC+2 summer) between 00:00 and 02:00 local time, UTC's today is
 * yesterday in their local view. They'd see "yesterday" as the min on
 * an appointment-date input, letting them pick a date that's already
 * past in their local timezone.
 *
 * en-CA locale formats date as YYYY-MM-DD — matching what date inputs
 * expect — using the browser's local timezone naturally (no explicit
 * tz needed since the platform is Swiss-based and users browsing from
 * elsewhere see their own local time, which matches what they intuit).
 *
 * CAVEAT: This function returns different output on the server (Node
 * tz, usually UTC) vs the browser. Callers that render the result into
 * SSR'd HTML MUST defer the call to useEffect or useState lazy init in
 * a 'use client' component, otherwise React will log a hydration
 * mismatch. See AppointmentBookingForm.tsx and useProtocolForm.ts for
 * the pattern.
 */
export function todayLocalIso(): string {
  return new Date().toLocaleDateString('en-CA');
}
