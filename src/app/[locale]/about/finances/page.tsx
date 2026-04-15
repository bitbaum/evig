import { Metadata } from 'next'
import FinancesContent from './FinancesContent'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: `${t('finances.meta.title')} - ${ORG.name}`,
    description: t('finances.meta.description'),
  }
}

export default function FinancesPage() {
  return <FinancesContent />
}
