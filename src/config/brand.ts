/**
 * Brand geometry — SINGLE SOURCE OF TRUTH for the evig "eternal loop" mark.
 *
 * The Möbius/infinity mark (evig = "eternal" + the circular-reuse loop) is drawn
 * from these two stroked paths on a 0 0 64 64 canvas. Everything that renders the
 * mark — the <Logo> component, the OG share card, and the favicon/OG/panel raster
 * generators — reads it from HERE. Change the mark once, and every surface follows.
 *
 * The brand green comes from the design-token SSOT (`--color-primary-600` in
 * globals.css); components reference that token, never a hardcoded hex.
 */
export const EVIG_MARK = {
  viewBox: '0 0 64 64',
  strokeWidth: 9,
  /** Two continuous strands; the left loop's gap is the Möbius over/under twist. */
  paths: [
    'M30 30 C23 20 10 22 10 32 C10 42 23 44 30 34',
    'M27 35 C33 25 41 21 46 21 C55 21 55 34 49 39 C43 43 35 43 30 34 C28 31 27 30 26 29',
  ],
} as const
