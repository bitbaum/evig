/**
 * Guard: no i18n `*.meta.title` value may end with a brand suffix.
 *
 * Page metadata titles built from messages (`title: t.raw('…').meta.title`)
 * are wrapped by a layout `title.template` ('%s | Revamp-IT[ Projekte]'),
 * which appends the brand. A message value that ALSO ends with `| Revamp-IT`
 * (or the no-hyphen `| RevampIT`) renders the brand twice — e.g. the upcycling
 * minisite shipped "Monitor-Upcycling | RevampIT | Revamp-IT Projekte"
 * (PR #160). The source-side guard (no-doubled-title-brand) can't see this —
 * the title originates in message JSON, not a .tsx file.
 *
 * Rule: a `meta.title` must carry only the page-specific part; the template
 * adds the brand. A trailing `| <brand>` is therefore always wrong. The brand
 * appearing mid-sentence ("Support RevampIT") is fine and not flagged.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = join(__dirname, '../../../messages')
const BRAND_SUFFIX = /\| (?:RevampIT|Revamp-IT)\s*$/

function collectMetaTitles(obj: unknown, path: string, out: Array<{ path: string; value: string }>): void {
  if (obj === null || typeof obj !== 'object') return
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const next = path ? `${path}.${key}` : key
    if (key === 'title' && typeof val === 'string' && path.endsWith('.meta')) {
      out.push({ path: next, value: val })
    }
    collectMetaTitles(val, next, out)
  }
}

describe('no brand suffix in message titles', () => {
  const localeFiles = readdirSync(MESSAGES_DIR).filter((f) => /^[a-z]{2}\.json$/.test(f))

  it.each(localeFiles)('%s: no *.meta.title ends with a brand suffix', (file) => {
    const messages = JSON.parse(readFileSync(join(MESSAGES_DIR, file), 'utf8'))
    const titles: Array<{ path: string; value: string }> = []
    collectMetaTitles(messages, '', titles)

    const offenders = titles
      .filter((t) => BRAND_SUFFIX.test(t.value))
      .map((t) => `${t.path} = ${JSON.stringify(t.value)}`)

    expect(offenders).toEqual([])
  })
})
