/**
 * Brand geometry — SINGLE SOURCE OF TRUTH for the evig "eternal loop" mark.
 *
 * The refined eternal loop (evig = "eternal" + the circular-reuse loop) is a
 * single-stroke closed infinity, tilted -8°. Everything that renders the mark —
 * the <Logo> component, the /vision manifesto, the OG share card, and the
 * favicon/OG/panel raster generators — reads it from HERE. Change the mark once,
 * and every surface follows.
 *
 * The mark colour comes from the design-token SSOT (`--color-action` /
 * `--accent-action` — Ion Lime); components reference that token, never a hex.
 */
export const EVIG_MARK = {
  viewBox: '0 0 64 64',
  strokeWidth: 7,
  /** Slight tilt gives the loop motion; renderers wrap the paths in this transform. */
  transform: 'rotate(-8 32 32)',
  /** One continuous closed infinity stroke. */
  paths: [
    'M32 32 C24 19 12 19 12 32 C12 45 24 45 32 32 C40 19 52 19 52 32 C52 45 40 45 32 32',
  ],
} as const
