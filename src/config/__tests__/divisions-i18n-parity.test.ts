/**
 * Guard: the brand architecture in config and its strings in messages agree.
 *
 * `EVIG_DIVISIONS` / `DIVISION_PAGES` own the STRUCTURE (which divisions exist,
 * which strands a page tells, which boundaries it states, which strands link
 * somewhere); the message files own only the human sentences, paired by the
 * stable id. Nothing keeps the two halves honest at runtime: a strand added to
 * config with no strings renders a raw key, a `strandLinks` entry with no
 * `link` string renders a raw key as the call-to-action, and a strand REMOVED
 * from config leaves dead copy behind that nobody notices.
 *
 * The regression that prompted this: `strands.heading` was the literal "Drei
 * Teile, die zusammengehören" in all eight locales while `strands` listed four.
 * A hardcoded count in a sentence is a fact stored twice — so the heading is
 * now an ICU plural fed from `strands.length`, and this test refuses any locale
 * that spells the number out again.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { locales } from '@/i18n/routing'
import { DIVISION_PAGES, EVIG_DIVISIONS, type DivisionPageId } from '@/config/divisions'

const MESSAGES_DIR = join(__dirname, '../../../messages')

const load = (locale: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8'))

/** Read a dotted path, returning undefined for any missing segment. */
function at(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined
    return (node as Record<string, unknown>)[key]
  }, obj)
}

const de = load('de')
const pageIds = Object.keys(DIVISION_PAGES) as DivisionPageId[]

describe('divisions ↔ messages parity', () => {
  describe.each(EVIG_DIVISIONS.map((d) => d.id))('divisions.items.%s', (id) => {
    it.each(['tagline', 'description', 'cta'])('DE defines %s', (field) => {
      expect(typeof at(de, `divisions.items.${id}.${field}`)).toBe('string')
    })
  })

  describe.each(pageIds)('divisions.pages.%s', (id) => {
    const { strands, strandLinks, boundaries } = DIVISION_PAGES[id]
    const base = `divisions.pages.${id}`

    it.each(['meta.title', 'meta.description', 'hero.title', 'hero.lede', 'thesis.title', 'thesis.body', 'strands.eyebrow', 'strands.heading', 'boundary.eyebrow', 'boundary.heading', 'cta.heading', 'cta.body', 'cta.button'])(
      'DE defines %s',
      (field) => {
        expect(typeof at(de, `${base}.${field}`)).toBe('string')
      }
    )

    it.each(strands)('DE gives strand "%s" a title and body', (strand) => {
      expect(typeof at(de, `${base}.strands.${strand}.title`)).toBe('string')
      expect(typeof at(de, `${base}.strands.${strand}.body`)).toBe('string')
    })

    it.each(boundaries)('DE gives boundary "%s" a title and body', (boundary) => {
      expect(typeof at(de, `${base}.boundary.${boundary}.title`)).toBe('string')
      expect(typeof at(de, `${base}.boundary.${boundary}.body`)).toBe('string')
    })

    // A `link` string exists exactly where a href does: a link label with no
    // destination never renders, and a destination with no label renders a key.
    it.each(strands)('strand "%s" has link text iff it has a href', (strand) => {
      expect(typeof at(de, `${base}.strands.${strand}.link`) === 'string').toBe(
        Boolean(strandLinks?.[strand])
      )
    })

    // Locales may omit a subtree (clean DE fallback); shipping one that names a
    // strand or boundary config no longer has is dead copy, so fail on it.
    it.each(locales)('%s carries no strand or boundary the config dropped', (locale) => {
      const messages = locale === 'de' ? de : load(locale)
      const extraStrands = Object.keys((at(messages, `${base}.strands`) as object) ?? {}).filter(
        (key) => !['eyebrow', 'heading', ...strands].includes(key)
      )
      const extraBoundaries = Object.keys((at(messages, `${base}.boundary`) as object) ?? {}).filter(
        (key) => !['eyebrow', 'heading', ...boundaries].includes(key)
      )
      expect({ extraStrands, extraBoundaries }).toEqual({ extraStrands: [], extraBoundaries: [] })
    })

    // The strand count lives in config and reaches the heading as an ICU
    // argument — never spelled out in the sentence, in any language.
    it.each(locales)('%s counts strands via ICU, not in words', (locale) => {
      const heading = at(locale === 'de' ? de : load(locale), `${base}.strands.heading`)
      if (typeof heading !== 'string') return // omitted → falls back to DE
      expect(heading).toContain('{count')
    })
  })
})
