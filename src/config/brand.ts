/**
 * Brand geometry — SINGLE SOURCE OF TRUTH for the evig "orbit" mark.
 *
 * The mark is an eternal orbit (a ring — evig = "eternal", the circular-reuse
 * loop) carrying a single bright node: the spark of intelligence riding the
 * cycle. Everything that renders the mark — the <Logo> component, the /vision
 * manifesto, the OG share card, and the favicon/app-icon raster generators —
 * reads it from HERE. Change the mark once, and every surface follows.
 *
 * The colour comes from the design-token SSOT (`--color-action` — Ion Lime);
 * components reference that token, never a hex.
 */
export const EVIG_MARK = {
  viewBox: '0 0 64 64',
  /** Ring stroke weight. */
  strokeWidth: 6,
  /** The eternal orbit — a ring, expressed as a stroked circle path so it can
   *  be stroke-drawn (vision manifesto) as well as simply rendered. r17 @ 30,33. */
  ringPath: 'M13 33 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0',
  /** The intelligence spark — a filled node sitting on the ring (top-right). */
  node: { cx: 42, cy: 21, r: 6 },
} as const
