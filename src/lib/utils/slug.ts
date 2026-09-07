/**
 * Generate a URL-safe slug from a string.
 *
 * This site serves eight locales (de, fr, en, it, es, ja, ko, ru). The previous
 * implementation transliterated German umlauts and then deleted everything that
 * was not `[a-z0-9]`, which is right for German and wrong for the other seven:
 *
 *   'Café Genève'       -> 'caf-gen-ve'
 *   'Grüße aus Zürich'  -> 'grue-e-aus-zuerich'   (ß was never handled)
 *   'Educación Digital' -> 'educaci-n-digital'
 *   'Экология'          -> ''                     <- an EMPTY slug
 *   'リサイクル'          -> ''                     <- an EMPTY slug
 *
 * The empty results are the serious ones. An empty slug is a broken URL, and
 * where slugs carry a unique constraint the SECOND such record cannot be saved
 * at all — a Russian or Japanese title would fail to publish with nothing in
 * the error pointing anywhere near slug generation.
 *
 * Order is load-bearing:
 *   1. German expansion FIRST (ä→ae, ß→ss). It must run before step 2, because
 *      NFD would otherwise strip the diaeresis and turn 'ä' into 'a', giving
 *      'arzte' where Swiss convention wants 'aerzte'.
 *   2. NFD + strip combining marks — one rule covering every remaining Latin
 *      diacritic (é à ç ô ñ …) instead of a hand-maintained list that is always
 *      missing the next character somebody types.
 *   3. Keep letters and digits of ANY script (`\p{L}\p{N}`), not just ASCII, so
 *      non-Latin titles keep their text instead of vanishing. Browsers
 *      percent-encode these and the URL stays valid.
 */
export function generateSlug(text: string): string {
  const slug = String(text)
    .toLowerCase()
    // 1. German/Swiss convention, before any diacritic stripping.
    .replace(/[äöü]/g, m => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[m] ?? m)
    .replace(/ß/g, 'ss')
    // 2. Every other Latin diacritic: decompose, then drop the combining marks.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // 3. Any script's letters and digits survive; everything else separates.
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  if (slug) return slug;

  // Empty in, empty out: with no input there is no slug to invent, and callers
  // have always relied on this to detect "nothing entered yet".
  if (!String(text).trim()) return '';

  // Nothing survived — the input was punctuation or symbols only ('!!!').
  // Returning '' here would reintroduce the broken-URL bug this function exists
  // to fix, so fall back to a token that is short, valid, and stable for the
  // same input rather than random per call.
  let hash = 0;
  for (const ch of String(text)) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return `n-${hash.toString(36)}`;
}
