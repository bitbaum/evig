/**
 * The ONE long-form markdown pipeline for the blog. Both content sources —
 * git-authored posts (content/posts/*.{locale}.md) and DB posts written in
 * the admin editor (blog_posts, incl. the public submission flow) — parse
 * through bip-kit's typed-block parser and render through its reference
 * renderer (see LongformBody.tsx).
 *
 * Typed blocks are the security model: markdown becomes a discriminated
 * union, the renderer emits React elements from typed data, and there is no
 * HTML passthrough for content to hide in — which is what makes this safe
 * for DB/submission-sourced article bodies (the previous react-markdown
 * pipeline rendered them with no sanitizer at all).
 *
 * Isomorphic on purpose (no fs, no server-only imports) so a client-side
 * preview can run the exact same parse.
 */

import { parseContentBlocks, extractToc, unicodeSlugify } from 'bip-kit';
import type { ContentBlock, TocEntry } from 'bip-kit';
import { type TocHeading } from '@/lib/blog-toc';

/**
 * Normalize author-flavored markdown to bip-kit's deliberately scoped
 * vocabulary, without changing meaning (same normalization layer OrangeCat
 * ships in its src/lib/longform):
 *
 * - `* item` / `+ item` bullets → `- item` (bip-kit only parses `- `; the
 *   admin editor serialises `-`, but pasted/submitted markdown may not)
 * - indented list items are flattened to top-level (the parser has no
 *   nesting; a flat item preserves the text, an unparsed one would merge
 *   into the previous paragraph)
 * - `# Heading` → `## Heading` (the page renders the post title from
 *   metadata as the single h1; a body h1 is outside the vocabulary and
 *   would render as a literal `# …` paragraph)
 *
 * Code fences are left untouched — a `# comment` or `* pointer` inside
 * ``` fences is code, not markdown.
 */
export function normalizeLongformMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let inFence = false;
  const out = lines.map((line) => {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      return line;
    }
    if (inFence) {
      return line;
    }
    if (/^# (?!#)/.test(line)) {
      return `#${line}`;
    }
    const bullet = line.match(/^(\s*)[*+] (.*)$/);
    if (bullet) {
      return `- ${bullet[2]}`;
    }
    const nested = line.match(/^\s+- (.*)$/);
    if (nested) {
      return `- ${nested[1]}`;
    }
    return line;
  });
  return out.join('\n');
}

/**
 * evig's anchor contract: keep letters of any script (ä/ö/ü, 日本語,
 * кириллица …) rather than transliterating to ASCII. bip-kit's DEFAULT
 * slugger is ASCII-only, which would turn every heading in the ja/ko/ru
 * translations into `section-N` and silently rename the anchors of
 * already-published German posts (`#geräte` → `#geraete`).
 *
 * bip-kit v0.2.4 takes this as an option, so the policy is now one shared
 * object passed to BOTH the parser and the TOC — previously this file had to
 * re-slug the blocks itself in a second pass, which is how a heading's id and
 * its TOC entry could drift apart. `unicodeSlugify` is bip-kit's own export
 * and produces byte-identical slugs to the local `slugifyHeading` it replaces
 * (verified across all 725 headings in the 101 published post files), so no
 * published anchor moves.
 */
const SLUG_POLICY = { slugify: unicodeSlugify } as const;

export interface ParsedLongform {
  blocks: ContentBlock[];
  /** Full TOC (h2–h4); the same ids the heading blocks carry. */
  toc: TocEntry[];
  /** h2/h3 entries in the shape BlogTableOfContents consumes. */
  tocHeadings: TocHeading[];
}

/** Parse a long-form markdown body into bip-kit typed blocks + TOC. */
export function parseLongform(markdown: string): ParsedLongform {
  const blocks = parseContentBlocks(normalizeLongformMarkdown(markdown), SLUG_POLICY);
  const toc = extractToc(blocks, SLUG_POLICY);
  // Same display contract as the old extractHeadings: h2/h3 only, inline
  // emphasis/code markers stripped so the rail label reads cleanly.
  const tocHeadings: TocHeading[] = toc
    .filter((entry): entry is TocEntry & { level: 2 | 3 } => entry.level !== 4)
    .map((entry) => ({
      id: entry.id,
      text: entry.text.replace(/[*_`]/g, '').trim(),
      level: entry.level,
    }));
  return {
    blocks,
    toc,
    tocHeadings,
  };
}
