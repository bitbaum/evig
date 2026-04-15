// Type-safe next-intl message keys.
// When de.json changes, TypeScript will surface missing/extra keys in other files.
// Usage: useTranslations('nav') gives autocomplete for all keys in messages.nav
import type de from '../messages/de.json'

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof de
  }
}
