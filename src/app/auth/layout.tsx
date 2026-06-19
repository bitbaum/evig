import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale, getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'auth' })
  return {
    title: {
      template: `%s | ${ORG.name}`,
      // Bare — the parent root template (`%s | ORG`) appends the brand;
      // embedding it here too would render "… | Revamp-IT | Revamp-IT".
      default: t('accountTitle'),
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
      {/* Providers come from the root layout (correctly seeded with the server
          session) — no second <Providers> wrapper here. See dashboard/layout.tsx. */}
      {children}
    </NextIntlClientProvider>
  )
}
