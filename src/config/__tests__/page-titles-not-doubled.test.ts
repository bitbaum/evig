/**
 * A page title must not carry the org name — the layout template adds it.
 *
 * `src/app/[locale]/layout.tsx` sets `title.template = '%s | evig'`, so every
 * page title gets " | evig" appended automatically. Three separate places
 * added it a second time anyway, and each produced a real duplicate in the
 * browser tab, in search results and in shared links:
 *
 *   /            "evig – evig — Intelligenz, für alle bezahlbar … | evig"
 *                (a page prefix AND a message value that opened with "evig —")
 *   /about       "Über uns - evig | evig"   (page appended `${ORG.name}`)
 *   /knowhow     "Knowhow - … | evig | evig" (the MESSAGE VALUE ended "| evig")
 *
 * The homepage one was fixed, then /about and /knowhow turned up later by
 * reading rendered titles. Three instances of one mistake is where the class
 * gets closed rather than the instance.
 *
 * This catches the message-file half — a translator or a bulk edit
 * reintroducing "| evig" into a title string. The component half (appending
 * ORG.name in generateMetadata) is not statically checkable here; the note in
 * each page explains why the template owns the name.
 */

import de from '../../../messages/de.json'

/** Any title-ish key: `meta.title`, `hero.title`, `layoutTitle`, … */
const TITLE_KEY = /(^|\.)(meta\.)?(title|layoutTitle|metaTitle)$/i
/** "… | evig", "evig | …", "evig — …" at the start — the brand as decoration. */
const CARRIES_BRAND = /\|\s*evig\b|\bevig\s*\||^\s*evig\s*[—–-]/i

function walk(node: unknown, trail: string[] = []): Array<{ path: string; value: string }> {
  if (typeof node === 'string') return [{ path: trail.join('.'), value: node }]
  if (Array.isArray(node)) return node.flatMap((v, i) => walk(v, [...trail, String(i)]))
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => walk(v, [...trail, k]))
  }
  return []
}

describe('page titles do not repeat the org name', () => {
  const all = walk(de)
  const titles = all.filter((e) => TITLE_KEY.test(e.path))

  it('sweeps a non-trivial number of titles', () => {
    // A sweep that matched nothing would pass the assertion below trivially.
    expect(titles.length).toBeGreaterThan(20)
  })

  it('no title string carries the brand — the layout template appends it', () => {
    const offenders = titles
      .filter((e) => CARRIES_BRAND.test(e.value))
      .map((e) => `${e.path} :: "${e.value}" — the layout already appends "| evig"`)
    expect(offenders).toEqual([])
  })
})
