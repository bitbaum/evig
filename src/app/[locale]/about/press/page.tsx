import { Metadata } from 'next'
import PressPageContent from './content'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: `${t('press.meta.title')} - ${ORG.name}`,
    description: t('press.meta.description'),
  }
}

export default function PressPage() {
  return <PressPageContent />
}
