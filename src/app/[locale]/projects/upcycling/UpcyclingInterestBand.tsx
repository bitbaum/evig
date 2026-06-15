'use client'

import { usePathname } from '@/i18n/navigation'
import { UPCYCLING_INTEREST_SKIP_PATHS } from '@/config/upcycling-routes'
import { UpcyclingInterestCTA } from './UpcyclingInterestCTA'

interface UpcyclingInterestBandProps {
  eyebrow: string
  heading: string
  body: string
}

/**
 * Compact interest signup on sub-pages — landing already has a full section.
 */
export function UpcyclingInterestBand({
  eyebrow,
  heading,
  body,
}: UpcyclingInterestBandProps) {
  const pathname = usePathname()
  if (UPCYCLING_INTEREST_SKIP_PATHS.has(pathname)) return null

  return (
    <aside
      aria-labelledby="upcycling-interest-band-title"
      className="border-t border-subtle bg-surface-raised"
    >
      <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="ui-public-eyebrow">{eyebrow}</div>
        <p
          id="upcycling-interest-band-title"
          className="mt-3 text-lg font-semibold text-text-primary sm:text-xl"
        >
          {heading}
        </p>
        <p className="mt-2 text-sm text-text-secondary">{body}</p>
        <UpcyclingInterestCTA className="mt-6 max-w-md mx-auto" />
      </div>
    </aside>
  )
}
