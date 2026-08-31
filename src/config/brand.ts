/**
 * Brand geometry — SINGLE SOURCE OF TRUTH for the evig mark.
 *
 * The mark is the eternal-reuse infinity loop (evig = "eternal" + the circular
 * loop) with an AI spark — a four-point sparkle at the top-right — marking the
 * intelligence the loop makes accessible. Everything that renders the mark —
 * the <Logo> component, the /vision manifesto, the OG share card, and the
 * favicon/app-icon raster generators — reads it from HERE. Change it once, and
 * every surface follows.
 *
 * The colour comes from the design-token SSOT (`--color-action` — Ion Lime);
 * components reference that token, never a hex.
 */
export const EVIG_MARK = {
  viewBox: '0 0 64 64',
  /** Infinity-loop stroke weight. */
  strokeWidth: 7,
  /** The loop is tilted for motion; renderers wrap the loop path in this. */
  loopTransform: 'rotate(-8 32 32)',
  /** One continuous closed infinity stroke. */
  loopPath: 'M32 32 C24 19 12 19 12 32 C12 45 24 45 32 32 C40 19 52 19 52 32 C52 45 40 45 32 32',
  /** AI spark — a filled four-point sparkle, upright, at the top-right. */
  sparkPath: 'M50 5 Q50 12 57 12 Q50 12 50 19 Q50 12 43 12 Q50 12 50 5 Z',
} as const;
