import type { Metadata } from 'next'
import TechnikerListClient from './TechnikerListClient'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

// force-dynamic prevents static pre-rendering, which avoids the React-null/useState
// crash during build-time SSR (next-auth v5 beta circular-dep issue)
export const dynamic = 'force-dynamic'

interface TechnikerPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TechnikerPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default function TechnikerPage() {
  return <TechnikerListClient />
}
