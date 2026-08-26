import { Metadata } from 'next'
import AboutContent from './content'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  // The layout's title template already appends "| evig", so adding the org
  // name here produced "Über uns - evig | evig" in the browser tab. The
  // template owns the name; a page title is the descriptive half only.
  // openGraph gets the full form, because a shared card has no template.
  const title = t('meta.title')
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title: `${title} | ${ORG.name}`, description, type: 'website' },
  }
}

export default function AboutPage() {
  return <AboutContent />;
}
