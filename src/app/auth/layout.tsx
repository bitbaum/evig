import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import AppShell from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: {
    template: '%s | RevampIT',
    default: 'Konto | RevampIT',
  },
  description:
    'Melde dich bei RevampIT an, um Reparaturanfragen zu stellen, auf dem Marktplatz zu handeln und an Workshops teilzunehmen.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()
  const locale = await getLocale()
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AppShell>{children}</AppShell>
    </NextIntlClientProvider>
  )
}
