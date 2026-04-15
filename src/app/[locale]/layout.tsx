/**
 * Locale Layout — wraps public pages with NextIntlClientProvider and app providers.
 * html/body/font/globals.css live in the parent root layout (src/app/layout.tsx).
 * This layout is content-only: no html/body tags.
 */
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Providers } from '@/components/providers/providers'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { ORG } from '@/config/org'
import { routing, type Locale } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${ORG.name}`,
    default: `${ORG.name} — Alte Hardware. Neues Leben.`,
  },
  description: `${ORG.name} ist ein Schweizer Non-Profit-Verein für nachhaltige Technologie: Aufarbeitung, Reparatur, Open-Source-Lösungen und Workshops.`,
  keywords: ['Elektroschrott', 'Recycling', 'Aufarbeitung', 'nachhaltige Technologie', 'Workshops', 'Freiwilligenarbeit'],
  openGraph: {
    url: ORG.website,
    siteName: ORG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale — return 404 for unknown locale segments
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Load messages for this locale — passed to client via NextIntlClientProvider
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Providers>
        <ConditionalMainLayout>
          {children}
        </ConditionalMainLayout>
        <CookieBanner />
      </Providers>
    </NextIntlClientProvider>
  )
}
