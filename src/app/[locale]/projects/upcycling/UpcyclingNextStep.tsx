import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  UPCYCLING_PAGE_FLOW,
  type UpcyclingFlowFromKey,
} from '@/config/upcycling-routes'
import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'

type NextStepCopy = {
  eyebrow: string
  title: string
  body: string
  cta: string
}

type NextStepMessages = Partial<Record<UpcyclingFlowFromKey, NextStepCopy>>

interface UpcyclingNextStepProps {
  from: UpcyclingFlowFromKey
  messages: NextStepMessages
}

/**
 * Single outbound “continue reading” band — keeps each page focused while
 * guiding visitors through the mini-site without duplicating full sections.
 */
export function UpcyclingNextStep({ from, messages }: UpcyclingNextStepProps) {
  const toKey = UPCYCLING_PAGE_FLOW[from]
  const copy = messages[from]
  if (!toKey || !copy) return null

  const href = UPCYCLING_ROUTES[toKey]

  return (
    <section className="border-t border-subtle bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          href={href}
          className="group flex flex-col gap-3 rounded-lg border border-subtle bg-surface-base p-6 transition-colors hover:border-default sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex-1 min-w-0">
            <div className="ui-public-eyebrow">{copy.eyebrow}</div>
            <p className="mt-2 text-lg font-semibold text-text-primary">{copy.title}</p>
            <p className="mt-1 text-sm text-text-secondary">{copy.body}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action transition-all group-hover:gap-2 shrink-0">
            {copy.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  )
}
