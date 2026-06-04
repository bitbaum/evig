'use client'

/**
 * ProjectNeedsSection — public-facing list of open needs for a project.
 *
 * The `labels` prop matches the flat shape of messages/<locale>.json
 * projects.<slug>.needs — so callers can pass it through verbatim.
 */

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { NeedContributionDialog } from './NeedContributionDialog'
import { GraduationCap, Cpu, Handshake, Banknote, Clock, type LucideIcon } from 'lucide-react'
import type { NeedType } from '@/config/projects'

interface ProjectNeed {
  id: string
  type: NeedType
  title: string
  description: string | null
  targetQuantity: number | null
  targetUnit: string | null
  status: string
}

export interface NeedsSectionLabels {
  title: string
  intro: string
  loading: string
  empty: string
  helpCta: string
  errorGeneric: string
  errorTooMany: string
  dialogTitle: string
  dialogIntro: string
  fields: { name: string; email: string; phone: string; organization: string; message: string }
  messagePlaceholder: string
  submitting: string
  submit: string
  cancel: string
  successTitle: string
  successBody: string
  typeLabels: Record<NeedType, string>
}

const TYPE_ICON: Record<NeedType, LucideIcon> = {
  expertise:      GraduationCap,
  hardware:       Cpu,
  partner_intro:  Handshake,
  funding:        Banknote,
  volunteer_time: Clock,
}

interface Props {
  slug: string
  labels: NeedsSectionLabels
}

export function ProjectNeedsSection({ slug, labels }: Props) {
  const [needs, setNeeds] = useState<ProjectNeed[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeNeed, setActiveNeed] = useState<ProjectNeed | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/projects/${encodeURIComponent(slug)}/needs`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json?.success) setNeeds(json.data as ProjectNeed[])
        else setError(labels.errorGeneric)
      })
      .catch(() => { if (!cancelled) setError(labels.errorGeneric) })
    return () => { cancelled = true }
  }, [slug, labels.errorGeneric])

  if (needs && needs.length === 0 && !error) return null

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-raised">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
            {labels.title}
          </h2>
          <p className="text-base sm:text-lg text-text-tertiary max-w-3xl mx-auto">
            {labels.intro}
          </p>
        </div>

        {needs === null && !error && (
          <p className="text-center text-sm text-text-tertiary">{labels.loading}</p>
        )}

        {error && (
          <p className="text-center text-sm text-error-600 dark:text-error-400">{error}</p>
        )}

        {needs && needs.length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {needs.map(need => {
              const Icon = TYPE_ICON[need.type] ?? GraduationCap
              return (
                <div key={need.id} className={cn(designPrimitive.surface.card, 'p-5 sm:p-6 flex flex-col')}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-muted/15">
                      <Icon className="h-5 w-5 text-action" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-0.5">
                        {labels.typeLabels[need.type] ?? need.type}
                      </p>
                      <h3 className="text-base font-semibold text-text-primary wrap-break-word">
                        {need.title}
                      </h3>
                    </div>
                  </div>

                  {need.description && (
                    <p className="text-sm text-text-secondary mb-4 grow">
                      {need.description}
                    </p>
                  )}

                  {need.targetQuantity != null && (
                    <p className="text-xs text-text-tertiary mb-4">
                      <span className="font-semibold">{need.targetQuantity}</span>
                      {need.targetUnit ? ` ${need.targetUnit}` : ''}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveNeed(need)}
                    className={cn(
                      designPrimitive.buttonBase,
                      designPrimitive.buttonSize.default,
                      designPrimitive.button.primary,
                      'mt-auto w-full justify-center min-h-touch',
                    )}
                  >
                    {labels.helpCta}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activeNeed && (
        <NeedContributionDialog
          slug={slug}
          need={activeNeed}
          labels={labels}
          typeLabel={labels.typeLabels[activeNeed.type] ?? activeNeed.type}
          onClose={() => setActiveNeed(null)}
        />
      )}
    </section>
  )
}
