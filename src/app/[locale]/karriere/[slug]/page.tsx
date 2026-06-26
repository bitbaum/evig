export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ORG } from '@/config/org'
import { getVacancyBySlug } from '@/lib/services/hr-vacancies'
import { PUBLIC_VACANCY_STATUSES, type VacancyStatus } from '@/config/hr-vacancies'
import { publicVacancyUrl } from '@/lib/hr/public-urls'
import CareerDetailClient from './CareerDetailClient'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const posting = await getVacancyBySlug(slug)
  if (!posting || !PUBLIC_VACANCY_STATUSES.includes(posting.status as VacancyStatus)) {
    return { title: 'Stelle nicht gefunden' }
  }

  const title = posting.seo_title ?? posting.title
  const description = posting.seo_description ?? posting.summary ?? posting.title
  const url = publicVacancyUrl(slug)

  return {
    title: { absolute: `${title} | ${ORG.name}` },
    description,
    openGraph: {
      title: `${title} | ${ORG.name}`,
      description,
      type: 'website',
      url,
    },
    alternates: { canonical: url },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: posting.title,
        description: posting.summary ?? posting.description.slice(0, 500),
        datePosted: posting.published_at,
        validThrough: posting.application_deadline,
        hiringOrganization: {
          '@type': 'Organization',
          name: ORG.name,
          sameAs: ORG.website,
        },
        jobLocation: posting.remote_ok
          ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'CH' } }
          : undefined,
        employmentType: posting.role_track,
      }),
    },
  }
}

export default async function CareerDetailPage({ params }: PageProps) {
  const { slug } = await params
  const posting = await getVacancyBySlug(slug)

  if (!posting || !PUBLIC_VACANCY_STATUSES.includes(posting.status as VacancyStatus)) {
    notFound()
  }

  return (
    <main className="min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <CareerDetailClient posting={posting} />
      </div>
    </main>
  )
}
