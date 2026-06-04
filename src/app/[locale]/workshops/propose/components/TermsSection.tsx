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
      <div className="bg-surface-raised border rounded-lg p-6">
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">
          {t('sections.terms.title')}
        </Heading>

        <div className="space-y-3 text-sm text-text-secondary mb-4">
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
              className="mt-1 mr-3 text-action focus:ring-action"
              required
              aria-required="true"
            />
            <span className="text-sm font-medium text-text-secondary">
              {t('sections.terms.checkboxPrefix')}{' '}
              <Link href="/agb" className="text-action hover:text-action underline">
                {t('sections.terms.termsLink')}
              </Link>{' '}
              {t('sections.terms.checkboxMiddle')}{' '}
              <Link href="/datenschutz" className="text-action hover:text-action underline">
                {t('sections.terms.privacyLink')}
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
