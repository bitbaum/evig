import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

/**
 * Public Monatsrapport share — minimal shell, no admin chrome, no auth. The
 * intl provider is only here so the shared print button (which uses
 * next-intl) works on this unauthenticated page.
 */
export default async function ReportShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()
  const locale = await getLocale()
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}
