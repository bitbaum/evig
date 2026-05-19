'use client'

import { Link } from '@/i18n/navigation'
import { Wrench, GraduationCap } from 'lucide-react'
import { type OSSAlternative } from '@/config/open-source-registry'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

interface RevampITServicesCTAProps {
  alternative: OSSAlternative
}

export function RevampITServicesCTA({ alternative }: RevampITServicesCTAProps) {
  const t = useTranslations('services.openSourceSolutions.cta')
  const services = alternative.revampitServices
  if (!services) return null

  return (
    <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-5">
      <Heading level={3} className="text-base font-bold text-neutral-900 mb-3">
        {t('title')}
      </Heading>

      {services.itHilfeNote && (
        <div className="flex items-start gap-3 mb-3">
          <Wrench className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-800">{services.itHilfeNote}</p>
            <Link
              href={ROUTES.public.itHilfe}
              className="text-sm font-medium text-primary-700 hover:text-neutral-900 underline"
            >
              {t('itHilfeLink')}
            </Link>
          </div>
        </div>
      )}

      {services.workshopSlug && (
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-800">{t('workshopAvailable')}</p>
            <Link
              href={`/workshops/${services.workshopSlug}`}
              className="text-sm font-medium text-primary-700 hover:text-neutral-900 underline"
            >
              {t('workshopLink')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
