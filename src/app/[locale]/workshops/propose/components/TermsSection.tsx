'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'

interface TermsSectionProps {
  termsAccepted: boolean
  onChange: (accepted: boolean) => void
}

export function TermsSection({ termsAccepted, onChange }: TermsSectionProps) {
  const t = useTranslations('workshops.propose')

  return (
    <div className="mb-8">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
          {t('sections.terms.title')}
        </Heading>

        <div className="space-y-3 text-sm text-gray-700 mb-4">
          <p>• {t('sections.terms.term1')}</p>
          <p>• {t('sections.terms.term2')}</p>
          <p>• {t('sections.terms.term3')}</p>
          <p>• {t('sections.terms.term4')}</p>
          <p>• {t('sections.terms.term5')}</p>
          <p>• {t('sections.terms.term6')}</p>
        </div>

        <div className="mt-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1 mr-3 text-green-600 focus:ring-green-500"
              required
              aria-required="true"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('sections.terms.checkboxPrefix')}{' '}
              <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                {t('sections.terms.termsLink')}
              </Link>{' '}
              {t('sections.terms.checkboxMiddle')}{' '}
              <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                {t('sections.terms.privacyLink')}
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
