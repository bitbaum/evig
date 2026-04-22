import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAllAlternatives,
  getAlternativeById,
  getCategoryById,
} from '@/config/open-source-registry'
import { AlternativeDetail } from '../components/AlternativeDetail'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateStaticParams() {
  return getAllAlternatives().map(alt => ({ slug: alt.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.openSourceSolutions' })
  const alternative = getAlternativeById(slug)

  if (!alternative) {
    return { title: `${t('detail.notFound')} | ${ORG.name}` }
  }

  const category = getCategoryById(alternative.categoryId)

  return {
    title: `${alternative.name} — ${alternative.tagline} | ${ORG.name}`,
    description: alternative.description.slice(0, 160),
    openGraph: {
      title: `${alternative.name} — ${t('detail.openSourceAlternative')} | ${ORG.name}`,
      description: alternative.tagline,
      type: 'website',
    },
    keywords: [
      alternative.name,
      'open source',
      category?.label ?? '',
      ...alternative.replaces.map(r => r.appId),
    ].filter(Boolean),
  }
}

export default async function AlternativeDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const alternative = getAlternativeById(slug)

  if (!alternative) {
    notFound()
  }

  return <AlternativeDetail alternative={alternative} locale={locale} />
}
