/**
 * pickI18n — single helper for the "JSONB column of locale → translation
 * with canonical fallback" pattern used on DB-backed user-visible content
 * (workshops.title_i18n, project_needs.title_i18n, etc).
 *
 * Why it exists
 * -------------
 * The canonical content columns (workshops.title, project_needs.description,
 * …) hold the German source. A sibling JSONB column (added by migration 088)
 * holds the per-locale translations:
 *
 *   workshops.title          = "Linux Workshop"
 *   workshops.title_i18n     = { en: "Linux Workshop",
 *                                fr: "Atelier Linux",
 *                                ru: "Семинар по Linux", … }
 *
 * Reads — be they server components, API routes, or React hooks — call
 * pickI18n(canonical, jsonb, locale) and never reach into the JSONB shape
 * themselves. That keeps the "if no translation, fall back to canonical"
 * rule in exactly one place — SSOT for the picking strategy.
 *
 * Locale handling
 * ---------------
 * - 'de' always returns the canonical (DE *is* the source).
 * - Any other locale returns translations[locale] if present, otherwise the
 *   canonical. We never silently substitute another locale's translation —
 *   if the FR field is missing the visitor sees DE, not EN, because DE is
 *   the verified source.
 *
 * NULL safety
 * -----------
 * Both arguments are nullable so callers can pass raw DB rows without
 * destructuring. Returns null only if BOTH inputs are null — i.e. the column
 * is genuinely empty, which the UI should treat as "no value".
 */

type I18nMap = Record<string, string> | null | undefined

export function pickI18n(
  canonical: string | null | undefined,
  translations: I18nMap,
  locale: string,
): string | null {
  if (locale === 'de' || !translations) {
    return canonical ?? null
  }
  const translated = translations[locale]
  if (typeof translated === 'string' && translated.trim() !== '') {
    return translated
  }
  return canonical ?? null
}

/**
 * Convenience: shape a DB row's i18n fields into a locale-resolved view.
 * Caller passes the row + locale + the field-pair mapping. Result is the
 * same row shape with translated values overwriting the canonical fields.
 *
 *   pickRowI18n(workshop, 'fr', {
 *     title: 'titleI18n',
 *     description: 'descriptionI18n',
 *     duration: 'durationI18n',
 *   })
 *   → { ...workshop, title: <fr>, description: <fr>, duration: <fr> }
 */
export function pickRowI18n<T extends Record<string, unknown>>(
  row: T,
  locale: string,
  mapping: { [canonicalKey in keyof T]?: keyof T },
): T {
  if (locale === 'de') return row
  const out = { ...row }
  for (const [canonKey, i18nKey] of Object.entries(mapping) as Array<[
    keyof T,
    keyof T,
  ]>) {
    const canonical = row[canonKey]
    const translations = row[i18nKey] as I18nMap
    if (typeof canonical !== 'string' && canonical !== null && canonical !== undefined) continue
    const picked = pickI18n(canonical as string | null, translations, locale)
    if (picked !== null) out[canonKey] = picked as T[keyof T]
  }
  return out
}
