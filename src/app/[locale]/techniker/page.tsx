import type { Metadata } from 'next'
import TechnikerListClient from './TechnikerListClient'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface TechnikerPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TechnikerPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description'),
  }
}

export default function TechnikerPage() {
  return <TechnikerListClient />
}
