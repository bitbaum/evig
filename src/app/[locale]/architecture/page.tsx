// SSR only — lucide-react in server component scope can cause React-null in
// certain Turbopack SSG bundles (same guard as /projects, /space).
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { DivisionPage, divisionMetadata } from '@/components/divisions/DivisionPage'
import { getDivisionPage } from '@/config/divisions'

interface ArchitecturePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ArchitecturePageProps): Promise<Metadata> {
  const { locale } = await params
  return divisionMetadata(locale, 'architecture')
}

export default async function ArchitectureDivisionPage({ params }: ArchitecturePageProps) {
  const { locale } = await params
  return <DivisionPage locale={locale} division={getDivisionPage('architecture')} />
}
