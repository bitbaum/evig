'use client'

import { Link } from '@/i18n/navigation'
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
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
        <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
          {t('sections.terms.title')}
        </Heading>

        <div className="space-y-3 text-sm text-neutral-700 mb-4">
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
              className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
              required
              aria-required="true"
            />
            <span className="text-sm font-medium text-neutral-700">
              {t('sections.terms.checkboxPrefix')}{' '}
              <Link href="/agb" className="text-primary-600 hover:text-primary-700 underline">
                {t('sections.terms.termsLink')}
              </Link>{' '}
              {t('sections.terms.checkboxMiddle')}{' '}
              <Link href="/datenschutz" className="text-primary-600 hover:text-primary-700 underline">
                {t('sections.terms.privacyLink')}
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
