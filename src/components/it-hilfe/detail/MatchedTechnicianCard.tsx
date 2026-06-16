'use client'

/**
 * MatchedTechnicianCard
 *
 * Shows after the requester accepts an offer. The matched technician's
 * name, profile link, and phone number — phone is gated to the request
 * owner via the API mapper (mapRequestDetailRow only attaches
 * matchedHelperPhone when isOwner is true). PPP.2 UI.
 *
 * No tier badge here: by the time you're seeing this card the
 * conversation is open and you're coordinating logistics — tier is
 * irrelevant.
 */

import { Link } from '@/i18n/navigation'
import { Phone, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

interface Props {
  technicianId: string
  technicianName: string
  technicianPhone: string
}

export function MatchedTechnicianCard({ technicianId, technicianName, technicianPhone }: Props) {
  const t = useTranslations('itHelp.detail.matchedTechnician')

  return (
    <div className="card-shell p-6">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-3">
        {t('eyebrow')}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-text-tertiary shrink-0" aria-hidden="true" />
            <Link
              href={ROUTES.public.technicianProfile(technicianId)}
              className="text-text-primary font-semibold hover:text-action transition-colors"
            >
              {technicianName}
            </Link>
          </div>

          <p className="ui-public-meta mt-3 text-text-secondary text-sm">
            {t('description')}
          </p>
        </div>

        <a
          href={`tel:${technicianPhone}`}
          className="ui-public-cta inline-flex items-center gap-2 shrink-0"
          aria-label={t('callAriaLabel', { phone: technicianPhone })}
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
          {technicianPhone}
        </a>
      </div>
    </div>
  )
}
