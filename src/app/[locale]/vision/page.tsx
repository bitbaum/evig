import { Metadata } from 'next'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import VisionContent from './content'

interface VisionPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: VisionPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'vision' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function VisionPage({ params }: VisionPageProps) {
  const { locale } = await params
  return <VisionContent locale={locale} />
}
