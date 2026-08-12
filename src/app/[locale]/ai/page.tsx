// SSR only — lucide-react in server component scope can cause React-null in
// certain Turbopack SSG bundles (same guard as /projects, /space).
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { DivisionPage, divisionMetadata } from '@/components/divisions/DivisionPage'
import { getDivisionPage } from '@/config/divisions'

interface AiPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AiPageProps): Promise<Metadata> {
  const { locale } = await params
  return divisionMetadata(locale, 'ai')
}

export default async function AiDivisionPage({ params }: AiPageProps) {
  const { locale } = await params
  return <DivisionPage locale={locale} division={getDivisionPage('ai')} />
}
