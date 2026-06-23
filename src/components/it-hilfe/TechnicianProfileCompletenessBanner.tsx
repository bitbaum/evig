'use client'

import { Link } from '@/i18n/navigation'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { TechnicianProfileGap } from '@/lib/domain/technician-profile'
import { IT_HILFE } from '@/config/it-hilfe'

interface Props {
  gaps: TechnicianProfileGap[]
  /** When set, gap labels link to anchors on the profile edit page. */
  linkToProfileSections?: boolean
}

export function TechnicianProfileCompletenessBanner({ gaps, linkToProfileSections = false }: Props) {
  const t = useTranslations('profil.techniker.completeness')

  if (gaps.length === 0) return null

  const gapLabels: Record<TechnicianProfileGap, string> = {
    skills: t('gapSkills'),
    canton: t('gapCanton'),
    location: t('gapLocation'),
  }

  const gapHref: Record<TechnicianProfileGap, string> = {
    skills: `${IT_HILFE.routes.register}#skills`,
    canton: `${IT_HILFE.routes.register}#location`,
    location: `${IT_HILFE.routes.register}#location`,
  }

  return (
    <div
      className="mb-6 rounded-xl border border-warning-500/30 bg-warning-500/10 p-4"
      role="status"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" aria-hidden="true" />
        <div>
          <p className="font-medium text-text-primary">{t('title')}</p>
          <p className="mt-1 text-sm text-text-secondary">{t('description')}</p>
          <ul className="mt-3 space-y-1 text-sm text-text-secondary">
            {gaps.map((gap) => (
              <li key={gap}>
                {linkToProfileSections ? (
                  <Link href={gapHref[gap]} className="text-action hover:underline">
                    {gapLabels[gap]}
                  </Link>
                ) : (
                  <Link href={IT_HILFE.routes.register} className="text-action hover:underline">
                    {gapLabels[gap]}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
