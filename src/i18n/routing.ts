import { defineRouting } from 'next-intl/routing'

export const locales = ['de', 'fr', 'en', 'it', 'es', 'ja', 'ko', 'ru'] as const
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
  ru: 'Русский',
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // /de/shop → /shop (default locale has no prefix)
  localePrefix: 'as-needed',
  // Only URL prefix determines locale — no Accept-Language guessing.
  // Prevents users being randomly switched to their browser language.
  localeDetection: false,
})
