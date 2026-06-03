'use client'

/**
 * DeviceJourney — renders the post-donation journey of a device donation
 * on /dashboard/donations. Shows aggregate counts per stage and links to
 * any public marketplace listings. Privacy: never displays buyer info,
 * exact sale price, or recipient identity (those fields are not in the
 * API response either).
 */

import { useTranslations } from 'next-intl'
import { CheckCircle2, Package, Wrench, ShoppingBag, Home, Recycle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  DONATION_JOURNEY_STAGES,
  DONATION_JOURNEY_STAGE_ORDER,
  type DonationJourneyStage,
} from '@/config/donations'

export interface JourneyItem {
  stage: DonationJourneyStage
  listing_url: string | null
  sold_at: string | null
}

export interface DeviceJourneyProps {
  totalItems: number
  items: JourneyItem[]
}

// Headline progression: stages shown left→right on the stepper.
// parts/recycled are surfaced inline alongside rehomed in the summary line
// since they share progress rank — they're terminal states, not stepper stops.
const STEPPER_STAGES: DonationJourneyStage[] = [
  DONATION_JOURNEY_STAGES.RECEIVED,
  DONATION_JOURNEY_STAGES.REFURBISHED,
  DONATION_JOURNEY_STAGES.LISTED,
  DONATION_JOURNEY_STAGES.REHOMED,
]

const STAGE_ICONS: Record<DonationJourneyStage, typeof Package> = {
  [DONATION_JOURNEY_STAGES.AWAITING]: Package,
  [DONATION_JOURNEY_STAGES.RECEIVED]: Package,
  [DONATION_JOURNEY_STAGES.REFURBISHED]: Wrench,
  [DONATION_JOURNEY_STAGES.LISTED]: ShoppingBag,
  [DONATION_JOURNEY_STAGES.REHOMED]: Home,
  [DONATION_JOURNEY_STAGES.PARTS]: Recycle,
  [DONATION_JOURNEY_STAGES.RECYCLED]: Recycle,
}

export function DeviceJourney({ totalItems, items }: DeviceJourneyProps) {
  const t = useTranslations('dashboard.donations.journey')

  if (totalItems === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/[0.06]">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('awaiting')}
        </p>
      </div>
    )
  }

  // Count items at each stage, plus a "max reached" per item (for the stepper).
  const counts: Record<DonationJourneyStage, number> = {
    [DONATION_JOURNEY_STAGES.AWAITING]: 0,
    [DONATION_JOURNEY_STAGES.RECEIVED]: 0,
    [DONATION_JOURNEY_STAGES.REFURBISHED]: 0,
    [DONATION_JOURNEY_STAGES.LISTED]: 0,
    [DONATION_JOURNEY_STAGES.REHOMED]: 0,
    [DONATION_JOURNEY_STAGES.PARTS]: 0,
    [DONATION_JOURNEY_STAGES.RECYCLED]: 0,
  }
  for (const item of items) {
    counts[item.stage] += 1
  }

  const listingLinks = items
    .filter(i => i.listing_url)
    .map(i => i.listing_url!) as string[]

  // Summary line — the donor's headline takeaway.
  const summaryParts: string[] = []
  if (counts.rehomed > 0) summaryParts.push(t('countRehomed', { count: counts.rehomed }))
  if (counts.listed > 0) summaryParts.push(t('countListed', { count: counts.listed }))
  if (counts.refurbished > 0) summaryParts.push(t('countRefurbished', { count: counts.refurbished }))
  if (counts.received > 0) summaryParts.push(t('countReceived', { count: counts.received }))
  if (counts.parts > 0) summaryParts.push(t('countParts', { count: counts.parts }))
  if (counts.recycled > 0) summaryParts.push(t('countRecycled', { count: counts.recycled }))

  // For the stepper: a stage is "reached" if any item has reached it or beyond.
  function stageReached(stage: DonationJourneyStage): boolean {
    const stageRank = DONATION_JOURNEY_STAGE_ORDER[stage]
    return items.some(i => DONATION_JOURNEY_STAGE_ORDER[i.stage] >= stageRank)
  }

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">
        {t('heading')}
      </p>

      {/* Horizontal stepper */}
      <div className="flex items-center gap-1 sm:gap-2 mb-3" aria-label={t('heading')}>
        {STEPPER_STAGES.map((stage, idx) => {
          const Icon = STAGE_ICONS[stage]
          const reached = stageReached(stage)
          const isLast = idx === STEPPER_STAGES.length - 1
          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={
                    reached
                      ? 'w-8 h-8 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                  }
                  aria-current={reached ? 'step' : undefined}
                >
                  {reached ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={
                    reached
                      ? 'mt-1 text-[10px] sm:text-xs text-neutral-700 dark:text-neutral-300 text-center'
                      : 'mt-1 text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-600 text-center'
                  }
                >
                  {t(`stage.${stage}`)}
                </span>
              </div>
              {!isLast && (
                <div
                  className={
                    stageReached(STEPPER_STAGES[idx + 1])
                      ? 'h-0.5 w-4 sm:w-8 bg-primary-300 dark:bg-primary-700 mb-5'
                      : 'h-0.5 w-4 sm:w-8 bg-neutral-200 dark:bg-neutral-700 mb-5'
                  }
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Summary counts */}
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        {t('totalItems', { count: totalItems })}
        {summaryParts.length > 0 && ' · '}
        {summaryParts.join(' · ')}
      </p>

      {/* Public listing links — privacy-safe (only published listings expose URLs) */}
      {listingLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {listingLinks.map((url, i) => (
            <Link
              key={url}
              href={url}
              className="inline-flex items-center gap-1 text-sm text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline"
            >
              {listingLinks.length === 1 ? t('viewInShop') : t('viewInShopNumbered', { index: i + 1 })}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
