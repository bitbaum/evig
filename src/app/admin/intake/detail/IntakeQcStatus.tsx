'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Check, ExternalLink, AlertCircle, ArrowDownUp, CheckCheck, ClipboardList,
} from 'lucide-react'
import { ROUTES } from '@/config/routes'
import {
  INTAKE_TIERS,
  CHECKLIST_RESULTS,
  SECOND_PERSON_SOLO_OVERRIDE_NOTE,
} from '@/config/intake-checklist'
import type { IntakeTier, ChecklistResult } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'
import { LISTING_STATUS } from '@/config/marketplace'
import Heading from '@/components/admin/AdminHeading'
import type { DetailData, ChecklistProgress, ChecklistItemWithState } from '../types'

interface IntakeQcStatusProps {
  detail: DetailData
  progress: ChecklistProgress
  openBulkable: ChecklistItemWithState[]
  onlyFinalQaLeft: boolean
  finalQaItems: ChecklistItemWithState[]
  qcGate: boolean
  markingAll: boolean
  onMarkAllRequired: () => void
  onSetChecklistResult: (
    itemId: string,
    result: ChecklistResult | null,
    notes?: string,
    options?: { secondPersonOverride?: boolean },
  ) => void
  checklistError: string | null
  publishPrice: number
  setPublishPrice: (price: number) => void
  publishing: boolean
  onPublish: (options?: { skipQc?: boolean }) => void
  setNewTier: (tier: IntakeTier) => void
  setShowTierChange: (show: boolean) => void
}

export function IntakeQcStatus({
  detail,
  progress,
  openBulkable,
  onlyFinalQaLeft,
  finalQaItems,
  qcGate,
  markingAll,
  onMarkAllRequired,
  onSetChecklistResult,
  checklistError,
  publishPrice,
  setPublishPrice,
  publishing,
  onPublish,
  setNewTier,
  setShowTierChange,
}: IntakeQcStatusProps) {
  const t = useTranslations('admin.intake.detail')
  return (
    <>
      {/* Progress Bar — annahme items only; quick captures have no checklist */}
      {detail.intake_tier && (
      <div className="bg-surface-base border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {t('progress', { completed: progress.requiredCompleted, total: progress.requiredTotal })}
          </span>
          <div className="flex items-center gap-3">
            {progress.percentage < 100 && openBulkable.length > 0 && (
              <Button
                type="button"
                onClick={onMarkAllRequired}
                disabled={markingAll}
                variant="primary"
                size="sm"
                title={t('markAllRequiredTitle')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {markingAll ? t('markAllRequiredBusy') : t('markAllRequired')}
              </Button>
            )}
            <span className={`text-sm font-bold ${
              progress.percentage === 100 ? 'text-action' : 'text-text-secondary'
            }`}>
              {progress.percentage}%
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-surface-overlay rounded-full overflow-hidden">
          {/* Red is reserved for actual failures — normal progress is not
              an alarm, whatever the percentage. */}
          <div
            className={`h-full rounded-full transition-all ${
              detail.checklist_failed ? 'bg-error-500' : 'bg-action'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        {/* Everything testable passed — finish the last step HERE, where the
            eye is, not buried inside the 18-item list. */}
        {onlyFinalQaLeft && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-strong bg-action-muted px-3 py-2.5">
            <p className="text-sm text-text-primary sm:flex-1">{t('finalQaHint')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => finalQaItems.forEach(item => onSetChecklistResult(item.id, CHECKLIST_RESULTS.PASS))}
                title={t('finalQaConfirmTitle')}
              >
                {t('finalQaConfirm')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => finalQaItems.forEach(item =>
                  onSetChecklistResult(item.id, CHECKLIST_RESULTS.PASS, SECOND_PERSON_SOLO_OVERRIDE_NOTE, { secondPersonOverride: true }),
                )}
                title={t('finalQaSoloTitle')}
              >
                {t('finalQaSolo')}
              </Button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Failed QC — the device is stuck until fixed & retested, or re-tiered */}
      {detail.checklist_failed && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-error-300 dark:border-error-800 bg-error-50 dark:bg-error-900/20 rounded-lg p-4 space-y-2">
          <Heading level={3} className="font-medium flex items-center gap-2 text-error-800 dark:text-error-200">
            <AlertCircle className="w-4 h-4" /> {t('failedAlert.heading')}
          </Heading>
          <p className="text-sm text-error-700 dark:text-error-300">{t('failedAlert.body')}</p>
          {detail.intake_tier && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setNewTier(detail.intake_tier === INTAKE_TIERS.PARTS ? INTAKE_TIERS.RECYCLE : INTAKE_TIERS.PARTS); setShowTierChange(true) }}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg ${adminInteractive.rowHover}`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" /> {t('failedAlert.changeTierCta')}
            </Button>
          )}
        </div>
      )}

      {/* Checklist rejection (e.g. Vier-Augen-Prinzip) — never fail silently */}
      {checklistError && (
        <div className="flex items-start gap-2 text-sm text-error-700 dark:text-error-300 bg-error-50 dark:bg-error-900/20 border border-error-300 dark:border-error-800 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{checklistError}</span>
        </div>
      )}

      {/* Ready-to-publish is an action state, not checklist history. Keep the
          final price + publish action above the completed checklist so the
          shop hand-off is a sub-five-second task. */}
      {detail.checklist_complete &&
        (detail.intake_tier === INTAKE_TIERS.REFURBISH || (detail.intake_tier === null && !qcGate)) &&
        detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-strong bg-action-muted rounded-lg p-4">
          <Heading level={3} className="font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('publishHeading')}
          </Heading>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('sellingPriceLabel')}</label>
              <Input
                type="number"
                value={publishPrice || ''}
                onChange={(e) => setPublishPrice(Number(e.target.value))}
                min={0}
                className="w-32"
              />
            </div>
            <Button
              onClick={() => onPublish()}
              disabled={publishing || publishPrice <= 0}
              variant="primary"
              size="sm"
            >
              {publishing ? t('publishing') : t('publishNow')}
            </Button>
            <Link
              href={`${ROUTES.admin.intakeCapture}?edit=${detail.id}&returnTo=${encodeURIComponent(ROUTES.admin.intakeDetail(detail.id))}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 border border-default text-text-secondary rounded-lg ${adminInteractive.rowHover} text-sm font-medium`}
              title={t('openFullErfassungTitle')}
            >
              <ClipboardList className="w-4 h-4" />
              {t('openFullErfassung')}
            </Link>
          </div>
        </div>
      )}

      {/* Published is the primary outcome, so show it before the historical
          QC record. Published checklists are immutable and collapsed below. */}
      {detail.marketplace_status === INTAKE_STATUS.PUBLISHED &&
        detail.listing_status !== LISTING_STATUS.ACTIVE && detail.listing_status !== LISTING_STATUS.SOLD && (
        <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-warning-700 dark:text-warning-300 mx-auto" />
          <p className="text-sm font-medium text-warning-800 dark:text-warning-200">{t('listingInactiveBody')}</p>
          <Link href={ROUTES.admin.marketplace} className="inline-block text-sm font-medium text-action hover:underline">
            {t('manageListing')}
          </Link>
        </div>
      )}

      {detail.marketplace_status === INTAKE_STATUS.PUBLISHED &&
        (detail.listing_status === LISTING_STATUS.ACTIVE || detail.listing_status === LISTING_STATUS.SOLD) && (
        <div className="border-2 border-strong bg-action-muted rounded-lg p-4 text-center">
          <Check className="w-8 h-8 text-action mx-auto mb-2" />
          <p className="font-medium text-action">{detail.listing_status === LISTING_STATUS.SOLD ? t('listingSoldBody') : t('publishedConfirm')}</p>
          {detail.selling_price_chf != null && (
            <p className="text-sm text-action mt-1">
              {t('publishedPrice', { price: Number(detail.selling_price_chf).toFixed(2) })}
            </p>
          )}
          {detail.listing_id && (
            <Link
              href={ROUTES.public.marketplaceListing(detail.listing_id)}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-strong bg-surface-base px-4 py-2 text-sm font-medium text-action hover:underline"
            >
              {t('viewListing')} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </>
  )
}
