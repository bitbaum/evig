import { Metadata } from 'next'
import FinancesContent from './FinancesContent'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const title = `${t('finances.meta.title')} - ${ORG.name}`
  const description = t('finances.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default function FinancesPage() {
  return <FinancesContent />
}
