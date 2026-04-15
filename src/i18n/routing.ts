import { defineRouting } from 'next-intl/routing'

export const locales = ['de', 'fr', 'en', 'it', 'es', 'ja', 'ko'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale = 'de' satisfies Locale

export const localeLabels: Record<Locale, string> = {
  de: 'Deutsch',
  fr: 'Français',
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  ja: '日本語',
  ko: '한국어',
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // /de/shop → /shop (default locale has no prefix)
  localePrefix: 'as-needed',
})
