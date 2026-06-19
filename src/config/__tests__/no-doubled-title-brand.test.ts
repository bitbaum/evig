/**
 * Guard: no page/layout metadata may bake the brand into its `<title>`.
 *
 * The root and [locale] layouts define `title.template: '%s | Revamp-IT'`,
 * so Next.js appends the brand to every descendant title automatically. A page
 * or layout that ALSO appends `| Revamp-IT` to its own top-level `title`
 * (or to a `title.default`) renders it twice: "Mitmachen | Revamp-IT |
 * Revamp-IT". This is invisible to tsc/eslint and was shipped site-wide twice
 * (PRs #155, #156) before live <title> inspection caught it.
 *
 * Rule enforced here, scanning every page.tsx / layout.tsx under src/app:
 *   - A top-level metadata `title` that embeds the brand MUST use
 *     `title: { absolute: ... }` (which opts out of the template).
 *   - A `title.default` must NOT embed the brand (the parent template adds it).
 *   - `openGraph` / `twitter` titles are exempt — templates never touch them,
 *     so they SHOULD carry the brand. Those blocks are stripped before scanning.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ORG } from '../org'

const APP_DIR = join(__dirname, '../../app')
const BRAND = ORG.name // "Revamp-IT"

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry === 'page.tsx' || entry === 'layout.tsx') out.push(full)
  }
}

/** Remove balanced `openGraph: { … }` / `twitter: { … }` blocks so their
 *  (legitimately branded) titles don't trip the scan. */
function stripSocialBlocks(src: string): string {
  let out = src
  for (const key of ['openGraph', 'twitter']) {
    let idx: number
    while ((idx = out.indexOf(`${key}: {`)) !== -1) {
      const braceStart = out.indexOf('{', idx)
      let depth = 0
      let end = braceStart
      for (; end < out.length; end++) {
        if (out[end] === '{') depth++
        else if (out[end] === '}' && --depth === 0) break
      }
      out = out.slice(0, idx) + out.slice(end + 1)
    }
  }
  return out
}

/** Does this metadata source bake the brand into a top-level title/default? */
function findViolations(src: string): string[] {
  const scan = stripSocialBlocks(src)
  const issues: string[] = []

  // brand embedded directly in a title/default string literal, not absolute.
  // matches: title: `… | ${ORG.name}` / default: `… | Revamp-IT`
  const inline = new RegExp(
    String.raw`(?:title|default):\s*\`[^\`]*\| (?:\$\{ORG\.name\}|${BRAND})[^\`]*\``,
    'g',
  )
  if (inline.test(scan)) issues.push('top-level title/default embeds the brand (use { absolute } for title, or drop the brand from default)')

  // shorthand form: `const title = \`… | ${ORG.name}\`` reused as a bare
  // top-level `title,` (after social blocks are stripped, a remaining bare
  // `title,` means it was returned directly, not wrapped in { absolute }).
  const constBranded = /const title\s*=\s*`[^`]*\| (?:\$\{ORG\.name\}|Revamp-IT)[^`]*`/.test(src)
  const bareShorthand = /(?:^|\{|,)\s*title,\s*(?:$|\n|,)/m.test(scan)
  if (constBranded && bareShorthand) {
    issues.push('branded `const title` returned as bare `title,` — wrap in { absolute: title }')
  }

  return issues
}

describe('no doubled title brand', () => {
  it('no page/layout bakes the brand into its top-level title or default', () => {
    const files: string[] = []
    walk(APP_DIR, files)

    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      if (!/generateMetadata|export const metadata/.test(src)) continue
      // Exempt: a layout that has NO title.template ancestor can legitimately
      // brand its title. In this app the root + [locale] layouts always supply
      // a template, so every descendant is covered — but the root layout itself
      // only defines the template/default (no branded top-level title), so it
      // passes naturally.
      const issues = findViolations(src)
      if (issues.length) {
        offenders.push(`${file.replace(APP_DIR, 'src/app')}:\n    - ${issues.join('\n    - ')}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
