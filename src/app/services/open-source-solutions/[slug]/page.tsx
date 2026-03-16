import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAllAlternatives,
  getAlternativeById,
  getCategoryById,
} from '@/config/open-source-registry'
import { AlternativeDetail } from '../components/AlternativeDetail'

export async function generateStaticParams() {
  return getAllAlternatives().map(alt => ({ slug: alt.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const alternative = getAlternativeById(slug)

  if (!alternative) {
    return { title: 'Nicht gefunden | RevampIT' }
  }

  const category = getCategoryById(alternative.categoryId)

  return {
    title: `${alternative.name} — ${alternative.tagline} | RevampIT`,
    description: alternative.description.slice(0, 160),
    openGraph: {
      title: `${alternative.name} — Open-Source-Alternative | RevampIT`,
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

export default async function AlternativeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const alternative = getAlternativeById(slug)

  if (!alternative) {
    notFound()
  }

  return <AlternativeDetail alternative={alternative} />
}
