import { Metadata } from 'next'
import ImpactPageContent from './content'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: `${t('impact.meta.title')} - ${ORG.name}`,
    description: t('impact.meta.description'),
  }
}

export default function ImpactPage() {
  return <ImpactPageContent />
}

