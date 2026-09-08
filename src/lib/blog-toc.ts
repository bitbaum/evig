/**
 * Table-of-contents helpers for blog posts.
 *
 * Pure string/util code — no `fs`, no React — so it is safe to import from both
 * the server (heading extraction) and the client (the sticky TOC component).
 * The slug produced here MUST match the `id` the markdown renderer puts on each
 * heading, so anchor links and scroll-spy line up.
 */

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Stable, unicode-friendly slug (keeps ä/ö/ü, 日本語, etc.). */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

// Heading EXTRACTION moved to src/lib/longform/parse.ts: the bip-kit block
// parser is the one markdown reader now, and the TOC derives from the same
// typed blocks the article renders — one id contract, no regex re-parse.
