/**
 * next-intl mock for Jest.
 *
 * useTranslations returns a function that returns the translation key,
 * allowing components to render without a NextIntlClientProvider.
 * Tests that need specific translated text should pass it as props or
 * mock this module locally with jest.mock('next-intl', ...).
 */

const useTranslations = (_namespace) => (key, _params) => key

const useLocale = () => 'de'

const useMessages = () => ({})

const useFormatter = () => ({
  dateTime: (date) => String(date),
  number: (n) => String(n),
  relativeTime: (date) => String(date),
  list: (items) => items.join(', '),
})

const NextIntlClientProvider = ({ children }) => children

const getTranslations = async (_namespace) => (key, _params) => key

const getMessages = async () => ({})

const getLocale = async () => 'de'

module.exports = {
  useTranslations,
  useLocale,
  useMessages,
  useFormatter,
  NextIntlClientProvider,
  getTranslations,
  getMessages,
  getLocale,
}
