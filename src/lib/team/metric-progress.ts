/**
 * Pure metric-progress helper — client-safe (NO db imports), so client
 * components can use it without pulling the server-only pg bundle.
 *
 * Returns a 0–100 fraction toward target, honouring direction. Null when a side
 * is missing (nothing to chart). "Higher is better": current/target. "Lower is
 * better": target/current (so beating the target caps at 100%).
 */
export function metricProgress(
  current: string | number | null,
  target: string | number | null,
  higherIsBetter: boolean,
): number | null {
  const c = current == null ? null : Number(current)
  const t = target == null ? null : Number(target)
  if (c == null || t == null || Number.isNaN(c) || Number.isNaN(t) || t === 0) return null
  const raw = higherIsBetter ? c / t : t / c
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.min(100, Math.round(raw * 100))
}
