'use client'

import { Link } from '@/i18n/navigation'
import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

/**
 * Shown to the request owner when the request is open but has zero offers — a
 * dead "Noch keine Techniker gefunden" state otherwise. Nudges the OWNER toward
 * the levers that actually attract technicians.
 *
 * Direction matters: in the solidarity model the requester's budget is the
 * incentive offered to a technician, so the lever is to RAISE/add compensation,
 * not drop it (dropping is the marketplace-listing move). For a Gratis request
 * we don't tell someone in need to pay — we nudge sharing / broadening instead,
 * with paying only as a gentle option.
 */
export function OwnerNoOffersNudge({
  requestId,
  budgetType,
}: {
  requestId: string
  budgetType: string
}) {
  const t = useTranslations('itHelp.detail.noOffersNudge')
  const isFree = budgetType === 'free'

  return (
    <div className="card-shell p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-muted">
          <Sparkles className="h-5 w-5 text-action" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <Heading level={3} className="text-base font-medium text-text-primary">
            {t('title')}
          </Heading>
          <p className="mt-1 text-sm text-text-secondary">
            {isFree ? t('bodyFree') : t('bodyPaid')}
          </p>
          <div className="mt-4">
            <Button as={Link} href={`/it-hilfe/${requestId}/edit`} variant="primary">
              {t('cta')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
