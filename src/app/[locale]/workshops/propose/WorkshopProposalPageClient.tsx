'use client'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import {
  GraduationCap,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { WorkshopProposalForm } from './components/WorkshopProposalForm'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function WorkshopProposalPage() {
  const { data: session } = useSession()
  const t = useTranslations('workshops.propose')

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
            <Heading level={1} className={`${responsiveTypography.subsection} text-neutral-900 mb-4`}>
              {t('loginRequired')}
            </Heading>
            <p className="text-neutral-600 mb-6">
              {t('loginPrompt')}
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('loginButton')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
              <GraduationCap className="w-8 h-8 text-primary-600" />
            </div>
            <Heading level={1} className={`${responsiveTypography.section} text-neutral-900 mb-2`}>
              {t('title')}
            </Heading>
            <p className="text-neutral-600">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <WorkshopProposalForm />
      </div>
    </div>
  )
}
