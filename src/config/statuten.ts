/**
 * Statuten — STRUCTURE SSOT
 *
 * Owns the ordering, numbering and grouping of the articles. The prose lives
 * in `messages/<locale>.json` under the `statuten` namespace, keyed by the ids
 * below — never in arrays, so a missing translation falls back per-key to the
 * canonical German instead of dropping a whole block (see src/i18n/request.ts).
 *
 * Adding an article = one entry here + its `title`/`body` strings. Numbering,
 * the table of contents, and the anchors all follow automatically.
 *
 * The GERMAN text is the legally authoritative version; every other locale is
 * a reading aid. `STATUTEN_AUTHORITATIVE_LOCALE` is the SSOT for that claim.
 */

/** The locale whose wording is legally binding. */
export const STATUTEN_AUTHORITATIVE_LOCALE = 'de' as const

/**
 * Adoption state. evig is `in Gründung` — these statutes are a DRAFT and have
 * NOT been adopted by a founding assembly. Flip to 'adopted' together with
 * `adoptedOn` on the day the Gründungsversammlung resolves them, and only then.
 * Until that happens the page renders an unmistakable draft banner.
 */
export const STATUTEN_STATUS: {
  state: 'draft' | 'adopted'
  /** ISO date of the founding assembly. Null while `state` is 'draft'. */
  adoptedOn: string | null
} = {
  state: 'draft',
  adoptedOn: null,
}

/** Public source of the document, so anyone can diff every revision. */
export const STATUTEN_SOURCE_URL =
  'https://github.com/bitbaum/evig/blob/main/docs/legal/STATUTEN.md'

export interface StatutenSection {
  id: string
  /** Roman numeral as printed in the document. */
  numeral: string
}

export interface StatutenArticle {
  id: string
  /** Article number as printed ("Art. 1"). */
  num: number
  /** Owning section id. */
  section: string
}

export const STATUTEN_SECTIONS = [
  { id: 'name', numeral: 'I' },
  { id: 'zweck', numeral: 'II' },
  { id: 'mitgliedschaft', numeral: 'III' },
  { id: 'organe', numeral: 'IV' },
  { id: 'transparenz', numeral: 'V' },
  { id: 'schluss', numeral: 'VI' },
] as const satisfies readonly StatutenSection[]

export const STATUTEN_ARTICLES = [
  { id: 'name-sitz', num: 1, section: 'name' },
  { id: 'zweck', num: 2, section: 'zweck' },
  { id: 'mittel', num: 3, section: 'zweck' },
  { id: 'beteiligungen', num: 4, section: 'zweck' },
  { id: 'erwerb', num: 5, section: 'mitgliedschaft' },
  { id: 'erloeschen', num: 6, section: 'mitgliedschaft' },
  { id: 'beitraege-haftung', num: 7, section: 'mitgliedschaft' },
  { id: 'organe', num: 8, section: 'organe' },
  { id: 'generalversammlung', num: 9, section: 'organe' },
  { id: 'vorstand', num: 10, section: 'organe' },
  { id: 'zeichnungsberechtigung', num: 11, section: 'organe' },
  { id: 'entschaedigung', num: 12, section: 'organe' },
  { id: 'revisionsstelle', num: 13, section: 'organe' },
  { id: 'offenlegung', num: 14, section: 'transparenz' },
  { id: 'geschaeftsjahr', num: 15, section: 'schluss' },
  { id: 'statutenaenderung', num: 16, section: 'schluss' },
  { id: 'aufloesung', num: 17, section: 'schluss' },
  { id: 'inkrafttreten', num: 18, section: 'schluss' },
] as const satisfies readonly StatutenArticle[]

export type StatutenSectionId = (typeof STATUTEN_SECTIONS)[number]['id']
export type StatutenArticleId = (typeof STATUTEN_ARTICLES)[number]['id']

/** Articles of one section, in document order. */
export function getStatutenArticlesBySection(
  sectionId: string
): readonly StatutenArticle[] {
  return STATUTEN_ARTICLES.filter(article => article.section === sectionId)
}

/** Stable anchor for deep-linking a single article. */
export function getStatutenAnchor(article: StatutenArticle): string {
  return `art-${article.num}`
}
