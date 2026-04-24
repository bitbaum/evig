import { Metadata } from 'next'
import PressPageContent from './content'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const title = `${t('press.meta.title')} - ${ORG.name}`
  const description = t('press.meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default function PressPage() {
  return <PressPageContent />
}
