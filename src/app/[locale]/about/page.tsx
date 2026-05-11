import { Metadata } from 'next'
import AboutContent from './content'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const title = `${t('meta.title')} - ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default function AboutPage() {
  return <AboutContent />;
}
