import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InquiryForm } from '@/components/community/InquiryForm'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface KontaktPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ thema?: string }>
}

export async function generateMetadata({ params }: KontaktPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved.kontakt' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function KontaktPage({ params, searchParams }: KontaktPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved.kontakt' })
  const { thema = '' } = await searchParams

  // @ts-expect-error — next-intl t.raw() doesn't type-check object values, but works at runtime
  const topics = t.raw('topics') as Record<string, string>
  const topicLabel = topics[thema] ?? t('defaultTopic')

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Back link */}
        <Link
          href="/get-involved"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backLink')}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <Heading level={1} className="text-gray-900 mb-2">
            {t('titlePrefix')} {topicLabel}
          </Heading>
          <p className="text-gray-600">
            {t('body')}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8">
          <InquiryForm defaultThema={thema} topicLabel={topicLabel} />
        </div>

      </div>
    </div>
  )
}
