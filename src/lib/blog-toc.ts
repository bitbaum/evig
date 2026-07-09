/**
 * Table-of-contents helpers for blog posts.
 *
 * Pure string/util code — no `fs`, no React — so it is safe to import from both
 * the server (heading extraction) and the client (the sticky TOC component).
 * The slug produced here MUST match the `id` the markdown renderer puts on each
 * heading, so anchor links and scroll-spy line up.
 */

export interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

/** Stable, unicode-friendly slug (keeps ä/ö/ü, 日本語, etc.). */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extract H2/H3 headings from markdown, skipping fenced code blocks so a shell
 * `# comment` inside ```bash never becomes a fake TOC entry.
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const out: TocHeading[] = []
  let inFence = false
  for (const raw of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(raw)
    if (!m) continue
    const level = m[1].length as 2 | 3
    // Drop inline emphasis/code markers so the visible label reads cleanly.
    const text = m[2].replace(/[*_`]/g, '').trim()
    if (text) out.push({ id: slugifyHeading(text), level, text })
  }
  return out
}
