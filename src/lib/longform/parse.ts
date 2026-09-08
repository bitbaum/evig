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

import { parseContentBlocks } from 'bip-kit';
import type { ContentBlock, TocEntry } from 'bip-kit';
import { slugifyHeading, type TocHeading } from '@/lib/blog-toc';

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
 * Re-slug heading ids with evig's unicode-friendly slug (blog-toc.ts keeps
 * ä/ö/ü, 日本語, кириллица …). bip-kit's own slugger is ASCII-only, which
 * would turn every heading in the ja/ko/ru translations into `section-N`
 * and silently change the anchor URLs of already-published German posts
 * (`#geräte` → `#geraete`). The slug contract stays exactly what the site
 * has always linked to; de-duplication mirrors bip-kit's (`slug`, `slug-2`).
 */
function reslugHeadings(blocks: ContentBlock[]): TocEntry[] {
  const seen = new Map<string, number>();
  const toc: TocEntry[] = [];
  for (const block of blocks) {
    if (block.type === 'h2' || block.type === 'h3' || block.type === 'h4') {
      const base = slugifyHeading(block.text) || 'section';
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const id = n === 1 ? base : `${base}-${n}`;
      block.id = id;
      toc.push({ id, text: block.text, level: Number(block.type.slice(1)) as 2 | 3 | 4 });
    }
  }
  return toc;
}

export interface ParsedLongform {
  blocks: ContentBlock[];
  /** Full TOC (h2–h4) with the re-slugged ids. */
  toc: TocEntry[];
  /** h2/h3 entries in the shape BlogTableOfContents consumes. */
  tocHeadings: TocHeading[];
}

/** Parse a long-form markdown body into bip-kit typed blocks + TOC. */
export function parseLongform(markdown: string): ParsedLongform {
  const blocks = parseContentBlocks(normalizeLongformMarkdown(markdown));
  const toc = reslugHeadings(blocks);
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
