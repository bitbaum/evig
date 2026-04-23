import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale, getTranslations } from 'next-intl/server'
import AppShell from '@/components/layout/AppShell'
import { ORG } from '@/config/org'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'auth' })
  return {
    title: {
      template: `%s | ${ORG.name}`,
      default: `${t('accountTitle')} | ${ORG.name}`,
    },
    description: t('accountDesc'),
    robots: { index: false, follow: false },
  }
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
