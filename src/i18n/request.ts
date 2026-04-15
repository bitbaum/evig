import { getRequestConfig } from 'next-intl/server'
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
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

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
