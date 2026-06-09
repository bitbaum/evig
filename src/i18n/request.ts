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

/** Parse the first matching locale from an Accept-Language header
 *  ("en-US,en;q=0.9,de;q=0.8" → "en"). Used as a last-resort fallback
 *  when neither the URL nor the cookie tells us the locale. */
function pickLocaleFromAcceptLanguage(header: string | null): string | undefined {
  if (!header) return undefined
  const tags = header.split(',').map(t => t.trim().split(';')[0].split('-')[0].toLowerCase())
  return tags.find(t => (routing.locales as readonly string[]).includes(t))
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolution order:
  //   1. requestLocale  — set by next-intl middleware on /[locale]/* routes
  //   2. NEXT_LOCALE cookie  — what next-intl + LanguageSwitcher write when
  //      the user picks or visits a locale; persists across /auth/* and other
  //      BYPASS_INTL routes where there is no URL locale
  //   3. Accept-Language header  — first-time visitors with no cookie yet
  //   4. defaultLocale  — last resort
  // This is the fix for "/en/admin redirects to /auth/login and the login
  // page renders in German" — /auth/* is in BYPASS_INTL so requestLocale
  // is empty; the cookie carries the user's actual preference across.
  const requested = await requestLocale
  let locale: string = routing.defaultLocale
  if (hasLocale(routing.locales, requested)) {
    locale = requested
  } else {
    const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value
    if (hasLocale(routing.locales, cookieLocale)) {
      locale = cookieLocale
    } else {
      const headerLocale = pickLocaleFromAcceptLanguage((await headers()).get('accept-language'))
      if (hasLocale(routing.locales, headerLocale)) {
        locale = headerLocale
      }
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
