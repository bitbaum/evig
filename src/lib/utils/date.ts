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
