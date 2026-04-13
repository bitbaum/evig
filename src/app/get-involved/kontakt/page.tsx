import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InquiryForm } from '@/components/community/InquiryForm'
import { ORG } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `Interesse bekunden | ${ORG.name}`,
  description: 'Schreib uns kurz, was dich interessiert — wir melden uns bei dir.',
}

const TOPIC_LABELS: Record<string, string> = {
  freiwilligenarbeit: 'Freiwilligenarbeit',
  praktikum: 'Praktikum',
  wiedereinstieg: 'Wiedereinstieg',
  'technische-experten': 'Technische Experten',
  partnerschaft: 'Partnerschaft',
}

interface Props {
  searchParams: Promise<{ thema?: string }>
}

export default async function KontaktPage({ searchParams }: Props) {
  const params = await searchParams
  const thema = params.thema ?? ''
  const topicLabel = TOPIC_LABELS[thema] ?? 'Mitmachen'

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Back link */}
        <Link
          href="/get-involved"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle Mitmach-Möglichkeiten
        </Link>

        {/* Header */}
        <div className="mb-8">
          <Heading level={1} className="text-gray-900 mb-2">
            Interesse an {topicLabel}
          </Heading>
          <p className="text-gray-600">
            Schreib uns kurz, wer du bist und was dich interessiert.
            Wir melden uns persönlich bei dir.
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
