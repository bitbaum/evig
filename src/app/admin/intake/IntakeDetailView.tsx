'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Check, RefreshCw, ExternalLink,
  AlertCircle, ArrowDownUp, Clock, CheckCheck, ClipboardList,
  Image as ImageIcon,
} from 'lucide-react'
import { KATEGORIEN, getConditionLabel } from '@/config/erfassung'
import { formatDateShort } from '@/lib/date-formats'
import {
  INTAKE_TIERS,
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  getIntakeTierOptions,
  requiresQualityControl,
  QUICK_CAPTURE_LABEL,
  QUICK_CAPTURE_ICON,
} from '@/config/intake-checklist'
import type { IntakeTier, ChecklistResult } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'
import type { IntakeEventType } from '@/lib/intake/timeline-types'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/intake/timeline-types'
import { ChecklistGroup } from './ChecklistGroup'
import { Stepper } from '@/components/ui/Stepper'
import type { DetailData } from './types'
import Heading from '@/components/admin/AdminHeading'

interface IntakeDetailViewProps {
  detail: DetailData | null
  detailLoading: boolean
  publishPrice: number
  setPublishPrice: (price: number) => void
  publishing: boolean
  showTierChange: boolean
  setShowTierChange: (show: boolean) => void
  newTier: IntakeTier
  setNewTier: (tier: IntakeTier) => void
  tierChangeReason: string
  setTierChangeReason: (reason: string) => void
  tierChanging: boolean
  onBack: () => void
  onRefresh: () => void
  onSetChecklistResult: (itemId: string, result: ChecklistResult | null, notes?: string) => void
  onMarkAllRequired: () => void
  onStartQc: () => void
  startingQc: boolean
  onPublish: () => void
  onTierChange: () => void
}

export function IntakeDetailView({
  detail,
  detailLoading,
  publishPrice,
  setPublishPrice,
  publishing,
  showTierChange,
  setShowTierChange,
  newTier,
  setNewTier,
  tierChangeReason,
  setTierChangeReason,
  tierChanging,
  onBack,
  onRefresh,
  onSetChecklistResult,
  onMarkAllRequired,
  onStartQc,
  startingQc,
  onPublish,
  onTierChange,
}: IntakeDetailViewProps) {
  const t = useTranslations('admin.intake.detail')
  const tForms = useTranslations('admin.forms')
  const pipelineSteps = t.raw('pipelineSteps') as { label: string; description: string }[]
  if (detailLoading || !detail) {
    return <div className="text-center py-8 text-text-tertiary">{t('loading')}</div>
  }

  const progress = detail.checklist_progress
  // Quick capture of a QC-required device category: publishing is blocked
  // until the checklist workflow is started (tier assigned).
  const qcGate = detail.intake_tier === null && requiresQualityControl(detail.category)

  // Pipeline step: 0 = checklist in progress, 1 = ready for erfassung, 2 = published
  const pipelineStep =
    detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? 2
    : detail.checklist_complete ? 1
    : 0

  return (
    <div className="space-y-6">
      {/* Pipeline progress — shown for refurbish-tier items */}
      {detail.intake_tier === INTAKE_TIERS.REFURBISH && (
        <div className="bg-surface-base border border rounded-lg px-4 py-3">
          <Stepper steps={pipelineSteps} currentStep={pipelineStep} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-sm text-action hover:underline mb-2 flex items-center gap-1"
          >
            {t('backToPipeline')}
          </Button>
          <Heading level={2} className="text-lg font-semibold">{detail.brand} {detail.product_name}</Heading>
          <div className="flex items-center gap-3 text-sm text-text-tertiary mt-1">
            <span className="font-mono">{detail.item_uuid}</span>
            <span>
              {detail.intake_tier
                ? <>{INTAKE_TIER_ICONS[detail.intake_tier]} {INTAKE_TIER_LABELS[detail.intake_tier]}</>
                : <>{QUICK_CAPTURE_ICON} {QUICK_CAPTURE_LABEL}</>}
            </span>
            {detail.source_donation_id && (
              <span className="text-action">{detail.donor_name ? t('donationWithName', { name: detail.donor_name }) : t('donation')}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-action-muted text-action">
              <Check className="w-4 h-4" /> {t('inShop')}
            </span>
          ) : (
            <>
              {detail.intake_tier && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setNewTier(detail.intake_tier === INTAKE_TIERS.REFURBISH ? INTAKE_TIERS.PARTS : INTAKE_TIERS.REFURBISH); setShowTierChange(true) }}
                  className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg ${adminInteractive.rowHover}`}
                  title={t('changeTier')}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" /> {t('changeTier')}
                </Button>
              )}
              <Button onClick={onRefresh} variant="ghost" size="icon" title={t('refresh')}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Device summary — what IS this thing (image, condition, price, …).
          Without it the detail page was a floating publish box in a void. */}
      <div className="bg-surface-base border rounded-lg p-4">
        <div className="flex gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-subtle bg-surface-raised">
            {detail.image_url ? (
               
              <img src={detail.image_url} alt={`${detail.brand} ${detail.product_name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-text-muted" aria-hidden="true" />
              </div>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-tertiary">{t('device.condition')}</dt>
              <dd className="font-medium text-text-primary">{getConditionLabel(detail.condition)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">{t('device.category')}</dt>
              <dd className="font-medium text-text-primary">
                {KATEGORIEN.find(k => k.value === detail.category)?.label || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">{t('device.price')}</dt>
              <dd className="font-medium text-text-primary tabular-nums">
                {detail.selling_price_chf != null ? `CHF ${Number(detail.selling_price_chf).toFixed(2)}` : '—'}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-text-tertiary">{t('device.captured')}</dt>
              <dd className="text-text-secondary">
                {formatDateShort(detail.created_at)}
                {detail.created_by_name ? ` · ${detail.created_by_name}` : ''}
              </dd>
            </div>
          </dl>
        </div>
        {detail.short_description && (
          <p className="mt-3 border-t border-subtle pt-3 text-sm text-text-secondary">
            {detail.short_description}
          </p>
        )}
      </div>

      {/* Progress Bar — annahme items only; quick captures have no checklist */}
      {detail.intake_tier && (
      <div className="bg-surface-base border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {t('progress', { completed: progress.requiredCompleted, total: progress.requiredTotal })}
          </span>
          <div className="flex items-center gap-3">
            {progress.percentage < 100 && (
              <Button
                type="button"
                onClick={onMarkAllRequired}
                variant="primary"
                size="sm"
                title={t('markAllRequiredTitle')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('markAllRequired')}
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
          <div
            className={`h-full rounded-full transition-all ${
              detail.checklist_failed ? 'bg-error-500' :
              progress.percentage === 100 ? 'bg-action' :
              progress.percentage > 50 ? 'bg-warning-500' : 'bg-error-400'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
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

      {/* Checklist Groups */}
      <div className="space-y-4">
        {detail.checklist_grouped.map((group) => (
          <ChecklistGroup
            key={group.category}
            group={group}
            onSetResult={onSetChecklistResult}
          />
        ))}
      </div>

      {/* QC gate — quick capture of a device category that requires the
          checklist: no publishing until the workflow is started */}
      {qcGate && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 space-y-3">
          <Heading level={3} className="font-medium flex items-center gap-2 text-warning-800 dark:text-warning-200">
            <AlertCircle className="w-4 h-4" /> {t('qcGate.heading')}
          </Heading>
          <p className="text-sm text-warning-700 dark:text-warning-200">{t('qcGate.body')}</p>
          <Button
            type="button"
            onClick={onStartQc}
            disabled={startingQc}
            variant="primary"
            size="sm"
          >
            {startingQc ? t('qcGate.starting') : t('qcGate.start')}
          </Button>
        </div>
      )}

      {/* Publish Section — refurbish-tier items (checklist-gated) and quick
          captures of accessory categories (no QC required) */}
      {(detail.intake_tier === INTAKE_TIERS.REFURBISH || (detail.intake_tier === null && !qcGate)) && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className={`border-2 rounded-lg p-4 ${
          detail.checklist_complete
            ? 'border-strong bg-action-muted'
            : 'border bg-surface-raised'
        }`}>
          <Heading level={3} className="font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('publishHeading')}
          </Heading>

          {!detail.checklist_complete && (
            <div className="flex items-start gap-2 mb-3 text-sm text-warning-700 dark:text-warning-200 bg-warning-50 dark:bg-warning-900/20 p-2 rounded-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{t('publishGate')}</span>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('sellingPriceLabel')}</label>
              <Input
                type="number"
                value={publishPrice || ''}
                onChange={(e) => setPublishPrice(Number(e.target.value))}
                min={0}
                className="w-32"
                disabled={!detail.checklist_complete}
              />
            </div>
            <Button
              onClick={onPublish}
              disabled={!detail.checklist_complete || publishing || publishPrice <= 0}
              variant="primary"
              size="sm"
            >
              {publishing ? t('publishing') : t('publishNow')}
            </Button>
            {detail.checklist_complete && (
              <Link
                href={`/admin/erfassung?edit=${detail.id}&returnTo=${encodeURIComponent(`/admin/intake?detail=${detail.id}`)}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 border border-default text-text-secondary rounded-lg ${adminInteractive.rowHover} text-sm font-medium`}
                title={t('openFullErfassungTitle')}
              >
                <ClipboardList className="w-4 h-4" />
                {t('openFullErfassung')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Published confirmation */}
      {detail.marketplace_status === INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-strong bg-action-muted rounded-lg p-4 text-center">
          <Check className="w-8 h-8 text-action mx-auto mb-2" />
          <p className="font-medium text-action">{t('publishedConfirm')}</p>
          {detail.selling_price_chf != null && (
            <p className="text-sm text-action mt-1">
              {t('publishedPrice', { price: Number(detail.selling_price_chf).toFixed(2) })}
            </p>
          )}
        </div>
      )}

      {/* Tier Change Dialog */}
      {showTierChange && (
        <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 space-y-3">
          <Heading level={3} className="font-medium flex items-center gap-2 text-warning-800 dark:text-warning-200">
            <ArrowDownUp className="w-4 h-4" /> {t('tierChange.heading')}
          </Heading>
          <div className="flex items-start gap-2 text-sm text-warning-700 dark:text-warning-200 bg-warning-100 dark:bg-warning-900/30 p-2 rounded-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{t('tierChange.warning')}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('tierChange.newTierLabel')}</label>
            <Select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as IntakeTier)}
              className="w-auto"
            >
              {getIntakeTierOptions().filter(o => o.value !== detail.intake_tier).map(o => (
                <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('tierChange.reasonLabel')}</label>
            <Input
              type="text"
              value={tierChangeReason}
              onChange={(e) => setTierChangeReason(e.target.value)}
              placeholder={t('tierChange.reasonPlaceholder')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onTierChange}
              disabled={tierChanging || !tierChangeReason.trim()}
              variant="warning"
              size="sm"
            >
              {tierChanging ? t('tierChange.applying') : t('tierChange.apply')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTierChange(false)}
              className={`px-3 py-1.5 border rounded-lg ${adminInteractive.rowHover} text-sm`}
            >
              {tForms('cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {detail.intake_events && detail.intake_events.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-surface-raised border-b">
            <Clock className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-medium">{t('timelineHeading')}</span>
            <span className="text-xs text-text-tertiary">({detail.intake_events.length})</span>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {[...detail.intake_events].reverse().map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2 text-xs">
                <span className="mt-0.5 text-base leading-none">{EVENT_TYPE_ICONS[event.type as IntakeEventType] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{EVENT_TYPE_LABELS[event.type as IntakeEventType] || event.type}</span>
                  <span className="text-text-tertiary ml-1.5">{event.description}</span>
                  <div className="text-text-muted mt-0.5">
                    {event.userEmail && <span>{event.userEmail}</span>}
                    {event.timestamp && (
                      <span className="ml-2">{new Date(event.timestamp).toLocaleString('de-CH')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
