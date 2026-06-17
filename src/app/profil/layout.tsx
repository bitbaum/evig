import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'

export default async function ProfilLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  const locale = await getLocale()
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* Providers come from the root layout (correctly seeded with the server
          session) — no second <Providers> wrapper here. See dashboard/layout.tsx. */}
      <ConditionalMainLayout>
        {children}
      </ConditionalMainLayout>
    </NextIntlClientProvider>
  )
}
