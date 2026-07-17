'use client'

import {
  AlertTriangle,
  Heart,
  PackageOpen,
  Recycle,
  ShieldCheck,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  CAPTURE_DESTINATIONS,
  type CaptureDestination,
} from '@/config/intake-workflow'
import type { DonationState } from './useErfassungForm'

interface DestinationOption {
  value: CaptureDestination
  icon: LucideIcon
  recommended?: boolean
  warning?: boolean
}

const DESTINATION_OPTIONS = [
  { value: CAPTURE_DESTINATIONS.QUALITY, icon: ShieldCheck, recommended: true },
  { value: CAPTURE_DESTINATIONS.INVENTORY, icon: Warehouse },
  { value: CAPTURE_DESTINATIONS.PARTS, icon: Wrench },
  { value: CAPTURE_DESTINATIONS.RECYCLE, icon: Recycle },
  { value: CAPTURE_DESTINATIONS.SHOP_UNTESTED, icon: AlertTriangle, warning: true },
] as const satisfies readonly DestinationOption[]

const RECOMMENDED_DESTINATION: DestinationOption = DESTINATION_OPTIONS[0]
const ALTERNATIVE_DESTINATIONS: readonly DestinationOption[] = DESTINATION_OPTIONS.slice(1)

interface CaptureDestinationFieldsProps {
  destination: CaptureDestination
  onDestinationChange: (destination: CaptureDestination) => void
  qcSkipReason: string
  onQcSkipReasonChange: (reason: string) => void
  donation: DonationState
  onDonationChange: (updater: (previous: DonationState) => DonationState) => void
}

/**
 * The only business decision in capture: where the canonical product record
 * goes next. It appears after AI/manual review, when category and condition
 * are known enough for the operator to make an informed choice.
 */
export function CaptureDestinationFields({
  destination,
  onDestinationChange,
  qcSkipReason,
  onQcSkipReasonChange,
  donation,
  onDonationChange,
}: CaptureDestinationFieldsProps) {
  const t = useTranslations('components.erfassung.destination')
  const isUntested = destination === CAPTURE_DESTINATIONS.SHOP_UNTESTED

  return (
    <section aria-labelledby="capture-destination-title" className="rounded-xl border border-default bg-surface-base p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-action-text">
          3
        </div>
        <div>
          <h2 id="capture-destination-title" className="text-base font-semibold text-text-primary">
            {t('title')}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{t('description')}</p>
        </div>
      </div>

      <div className="space-y-2">
        {[RECOMMENDED_DESTINATION].map(({ value, icon: Icon, recommended, warning }) => {
          const selected = destination === value
          return (
            <label
              key={value}
              className={cn(
                'flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                selected
                  ? warning
                    ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/15'
                    : 'border-action bg-action-muted'
                  : 'border-subtle hover:border-strong hover:bg-surface-raised',
              )}
            >
              <input
                type="radio"
                name="capture-destination"
                value={value}
                checked={selected}
                onChange={() => onDestinationChange(value)}
                className="sr-only"
              />
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', warning ? 'text-warning-700 dark:text-warning-400' : 'text-action')}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
                  {t(`options.${value}.label`)}
                  {recommended && (
                    <span className="rounded-full bg-action px-2 py-0.5 text-[11px] font-semibold text-action-text">
                      {t('recommended')}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-text-tertiary">
                  {t(`options.${value}.description`)}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      <details className="mt-3" open={destination !== CAPTURE_DESTINATIONS.QUALITY}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-action hover:underline">
          {t('otherDestinations')}
        </summary>
        <div className="mt-1 space-y-2">
          {ALTERNATIVE_DESTINATIONS.map(({ value, icon: Icon, warning }) => {
            const selected = destination === value
            return (
              <label
                key={value}
                className={cn(
                  'flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  selected
                    ? warning
                      ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/15'
                      : 'border-action bg-action-muted'
                    : 'border-subtle hover:border-strong hover:bg-surface-raised',
                )}
              >
                <input
                  type="radio"
                  name="capture-destination"
                  value={value}
                  checked={selected}
                  onChange={() => onDestinationChange(value)}
                  className="sr-only"
                />
                <Icon
                  className={cn('mt-0.5 h-5 w-5 shrink-0', warning ? 'text-warning-700 dark:text-warning-400' : 'text-action')}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text-primary">{t(`options.${value}.label`)}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-text-tertiary">{t(`options.${value}.description`)}</span>
                </span>
              </label>
            )
          })}
        </div>
      </details>

      {isUntested && (
        <div className="mt-3 rounded-lg border border-warning-300 bg-warning-50 p-3 dark:border-warning-800 dark:bg-warning-900/15">
          <label htmlFor="qc-skip-reason" className="block text-sm font-medium text-text-primary">
            {t('skipReasonLabel')}
          </label>
          <Textarea
            id="qc-skip-reason"
            value={qcSkipReason}
            onChange={(event) => onQcSkipReasonChange(event.target.value)}
            rows={2}
            minLength={10}
            required
            placeholder={t('skipReasonPlaceholder')}
            className="mt-2"
          />
          <p className="mt-1.5 text-xs text-text-secondary">{t('skipDisclosure')}</p>
          <p className="mt-1 text-xs font-medium text-warning-800 dark:text-warning-200">{t('skipPriceRequired')}</p>
        </div>
      )}

      <details className="mt-4 border-t border-subtle pt-4" open={Boolean(donation.existingDonationId)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-text-primary">
          <Heart className="h-4 w-4 text-action" aria-hidden="true" />
          {t('donationTitle')}
          {donation.isDonation && <span className="text-xs font-normal text-action">{t('donationActive')}</span>}
        </summary>

        <div className="mt-2 rounded-lg bg-surface-raised p-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={donation.isDonation}
              onChange={(event) => onDonationChange(previous => ({ ...previous, isDonation: event.target.checked }))}
              className="rounded border-strong text-action focus:ring-action"
            />
            {t('donationCheckbox')}
          </label>

          {donation.existingDonationId && (
            <p className="mt-2 flex items-center gap-2 rounded-md bg-action-muted px-3 py-2 text-xs text-action">
              <PackageOpen className="h-4 w-4" aria-hidden="true" />
              {t('existingDonation')}
            </p>
          )}

          {donation.isDonation && !donation.existingDonationId && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="donor-name" className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('donorName')}
                </label>
                <Input
                  id="donor-name"
                  value={donation.donorName}
                  onChange={(event) => onDonationChange(previous => ({ ...previous, donorName: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="donor-email" className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('donorEmail')}
                </label>
                <Input
                  id="donor-email"
                  type="email"
                  value={donation.donorEmail}
                  onChange={(event) => onDonationChange(previous => ({ ...previous, donorEmail: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="donor-notes" className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('donorNotes')}
                </label>
                <Textarea
                  id="donor-notes"
                  rows={2}
                  value={donation.donorNotes}
                  onChange={(event) => onDonationChange(previous => ({ ...previous, donorNotes: event.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </details>
    </section>
  )
}
