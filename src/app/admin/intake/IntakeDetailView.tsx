'use client'

import { useTranslations } from 'next-intl'
import {
  requiresQualityControl,
} from '@/config/intake-checklist'
import type { IntakeTier, ChecklistResult } from '@/config/intake-checklist'
import { INTAKE_TIERS } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'
import { Stepper } from '@/components/ui/Stepper'
import type { DetailData } from './types'
import { IntakeHeader } from './detail/IntakeHeader'
import { IntakeDeviceSummary } from './detail/IntakeDeviceSummary'
import { IntakeQcStatus } from './detail/IntakeQcStatus'
import { IntakeChecklistSection } from './detail/IntakeChecklistSection'
import { IntakePublishSection } from './detail/IntakePublishSection'
import { IntakeTierChangeDialog } from './detail/IntakeTierChangeDialog'
import { IntakeTimeline } from './detail/IntakeTimeline'

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
  checklistError: string | null
  checklistPendingItems: ReadonlySet<string>
  onSetChecklistResult: (
    itemId: string,
    result: ChecklistResult | null,
    notes?: string,
    options?: { secondPersonOverride?: boolean },
  ) => void
  onMarkAllRequired: () => void
  markingAll: boolean
  onStartQc: () => void
  startingQc: boolean
  onPublish: (options?: { skipQc?: boolean }) => void
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
  checklistError,
  checklistPendingItems,
  onSetChecklistResult,
  onMarkAllRequired,
  markingAll,
  onStartQc,
  startingQc,
  onPublish,
  onTierChange,
}: IntakeDetailViewProps) {
  const t = useTranslations('admin.intake.detail')
  const pipelineSteps = t.raw('pipelineSteps') as { label: string; description: string }[]
  if (detailLoading || !detail) {
    return <div className="text-center py-8 text-text-tertiary">{t('loading')}</div>
  }

  const progress = detail.checklist_progress
  // What EXACTLY is still open? A generic "alle Pflichtpunkte müssen abgehakt
  // sein" leaves people hunting through 18 items — name the gap instead.
  const openRequired = detail.checklist_grouped
    .flatMap(g => g.items)
    .filter(i => i.required && i.state.result === null)
  const openBulkable = openRequired.filter(i => !i.requiresSecondPerson)
  const finalQaItems = openRequired.filter(i => i.requiresSecondPerson)
  // Everything testable is done — only the Vier-Augen sign-off is left.
  const onlyFinalQaLeft = openRequired.length > 0 && openBulkable.length === 0
  // Quick capture of a QC-required device category: publishing is blocked
  // until the checklist workflow is started (tier assigned).
  const qcGate = detail.intake_tier === null && requiresQualityControl(detail.category)

  // Pipeline stage — must tell the truth: 0 = QC in progress, 1 = QC done /
  // ready to publish, 2 = publishing, 3 (= steps.length) = published, all done.
  const pipelineStep =
    detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? 3
    : detail.checklist_complete ? 2
    : 1

  return (
    <div className="space-y-6">
      {/* Pipeline progress — shown for refurbish-tier items */}
      {detail.intake_tier === INTAKE_TIERS.REFURBISH && (
        <div className="bg-surface-base border border rounded-lg px-4 py-3">
          <Stepper steps={pipelineSteps} currentStep={pipelineStep} />
        </div>
      )}

      <IntakeHeader
        detail={detail}
        onBack={onBack}
        onRefresh={onRefresh}
        setNewTier={setNewTier}
        setShowTierChange={setShowTierChange}
      />

      <IntakeDeviceSummary detail={detail} />

      <IntakeQcStatus
        detail={detail}
        progress={progress}
        openBulkable={openBulkable}
        onlyFinalQaLeft={onlyFinalQaLeft}
        finalQaItems={finalQaItems}
        qcGate={qcGate}
        markingAll={markingAll}
        onMarkAllRequired={onMarkAllRequired}
        onSetChecklistResult={onSetChecklistResult}
        checklistError={checklistError}
        publishPrice={publishPrice}
        setPublishPrice={setPublishPrice}
        publishing={publishing}
        onPublish={onPublish}
        setNewTier={setNewTier}
        setShowTierChange={setShowTierChange}
      />

      <IntakeChecklistSection
        detail={detail}
        checklistPendingItems={checklistPendingItems}
        onSetChecklistResult={onSetChecklistResult}
        qcGate={qcGate}
        publishPrice={publishPrice}
        publishing={publishing}
        onStartQc={onStartQc}
        startingQc={startingQc}
        onPublish={onPublish}
      />

      <IntakePublishSection
        detail={detail}
        qcGate={qcGate}
        openRequired={openRequired}
        publishPrice={publishPrice}
        setPublishPrice={setPublishPrice}
        publishing={publishing}
        onPublish={onPublish}
      />

      <IntakeTierChangeDialog
        showTierChange={showTierChange}
        detail={detail}
        newTier={newTier}
        setNewTier={setNewTier}
        tierChangeReason={tierChangeReason}
        setTierChangeReason={setTierChangeReason}
        tierChanging={tierChanging}
        onTierChange={onTierChange}
        setShowTierChange={setShowTierChange}
      />

      <IntakeTimeline detail={detail} />
    </div>
  )
}
