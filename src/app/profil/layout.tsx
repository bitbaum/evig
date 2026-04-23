import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import AppShell from '@/components/layout/AppShell'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'

export default async function ProfilLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  const locale = await getLocale()
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AppShell>
        <ConditionalMainLayout>
          {children}
        </ConditionalMainLayout>
      </AppShell>
    </NextIntlClientProvider>
  )
}
