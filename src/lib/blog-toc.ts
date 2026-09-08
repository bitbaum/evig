/**
 * Table-of-contents shape for blog posts.
 *
 * Pure type/util code — no `fs`, no React — so it is safe to import from both
 * the server (heading extraction) and the client (the sticky TOC component).
 */

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

// Heading EXTRACTION moved to src/lib/longform/parse.ts: the bip-kit block
// parser is the one markdown reader now, and the TOC derives from the same
// typed blocks the article renders — one id contract, no regex re-parse.
//
// SLUGGING moved to bip-kit too. The local `slugifyHeading` that used to live
// here is now bip-kit's `unicodeSlugify`, passed to the parser and the TOC as
// one policy (see longform/parse.ts). It was byte-identical, and keeping a
// second copy here is exactly how an id and the anchor linking to it drift.
