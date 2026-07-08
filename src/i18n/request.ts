import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { routing } from './routing'
import { hasLocale } from 'next-intl'

/**
 * Deep merge: target (German) is the base, source (requested locale) overrides.
 * Any key missing in the requested locale falls back to German — never shows key names.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sv = source[key]
    const tv = target[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
        tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>) as T[typeof key]
    } else if (sv !== undefined) {
      result[key] = sv as T[typeof key]
    }
  }
  return result
}


export default getRequestConfig(async ({ requestLocale }) => {
  // Resolution order:
  //   1. requestLocale  — set by next-intl middleware on /[locale]/* routes
  //   2. NEXT_LOCALE cookie  — what next-intl + LanguageSwitcher write when
  //      the user picks or visits a locale; persists across /auth/* and other
  //      BYPASS_INTL routes where there is no URL locale
  //   3. defaultLocale (German)  — last resort
  // We deliberately do NOT sniff the Accept-Language header: the Swiss site
  // defaults to German and only switches when the user explicitly picks another
  // locale (cookie) or visits a /[locale]/* URL — matching routing.localeDetection:
  // false. (BYPASS_INTL routes like /dashboard, /admin, /auth have no URL locale,
  // so the cookie carries the user's actual preference across them.)
  // The admin area is German-only — this resolver is the single source of truth
  // for its locale. Force DE for /admin/* so BOTH server (getTranslations) and
  // client render in German; the cookie/URL locale must never leak into admin.
  const path = (await headers()).get('x-current-path') || ''
  const requested = await requestLocale
  let locale: string = routing.defaultLocale
  if (path.startsWith('/admin')) {
    locale = routing.defaultLocale
  } else if (hasLocale(routing.locales, requested)) {
    locale = requested
  } else {
    const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value
    if (hasLocale(routing.locales, cookieLocale)) {
      locale = cookieLocale
    }
  }

  // German is the canonical source of truth
  const deMessages = (await import(`../../messages/de.json`)).default

  let messages = deMessages
  if (locale !== routing.defaultLocale) {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`)).default
      // Locale messages override German; missing keys fall back to German silently
      messages = deepMerge(deMessages, localeMessages)
    } catch {
      // Message file missing entirely — use German
      messages = deMessages
    }
  }

  return {
    locale,
    messages,
    // In development, warn about missing keys. In production, fail silently.
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[next-intl]', error.message)
      }
    },
    getMessageFallback({ key, namespace }) {
      // Last-resort fallback: return the key so UI isn't broken
      return namespace ? `${namespace}.${key}` : key
    },
  }
})
