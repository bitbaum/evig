'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIntakePipeline } from './useIntakePipeline'
import { useIntakeDetail } from './useIntakeDetail'
import { IntakePipelineView } from './IntakePipelineView'
import { IntakeDetailView } from './IntakeDetailView'
import { ROUTES } from '@/config/routes'

/**
 * Geräte-Eingang — one operational home for capture, triage, QC and publish.
 *
 * Capture has one canonical route at /admin/intake/capture. Input channels
 * converge on one product record before the operator chooses its destination.
 */
export default function IntakeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.has('detail') ? 'detail' : 'pipeline'

  const pipeline = useIntakePipeline(view === 'pipeline')
  const detail = useIntakeDetail()

  // URL params: donation cross-links open capture with donor prefill;
  // ?capture=1 preserves old bookmarks; ?detail=
  // re-opens a device (e.g. a QR scan or return from product editing).
  useEffect(() => {
    const isLegacyCapture =
      searchParams.get('capture') === '1' ||
      searchParams.has('donation_id') ||
      searchParams.has('donor_name') ||
      searchParams.has('donor_email')
    if (isLegacyCapture) {
      const forwarded = new URLSearchParams(searchParams.toString())
      forwarded.delete('capture')
      const query = forwarded.toString()
      router.replace(`${ROUTES.admin.intakeCapture}${query ? `?${query}` : ''}`)
      return
    }
    const detailId = searchParams.get('detail')
    if (detailId) {
      detail.openDetail(detailId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleOpenDetail = (id: string) => {
    router.push(ROUTES.admin.intakeDetail(id))
  }

  const handleBackToPipeline = () => {
    detail.clearDetail()
    router.push(ROUTES.admin.intake)
  }

  return (
    <div>
      {view === 'pipeline' && (
        <IntakePipelineView
          items={pipeline.items}
          loading={pipeline.loading}
          pagination={pipeline.pagination}
          statusCounts={pipeline.statusCounts}
          tierFilter={pipeline.tierFilter}
          statusFilter={pipeline.statusFilter}
          categoryFilter={pipeline.categoryFilter}
          searchFilter={pipeline.searchFilter}
          onTierFilterChange={pipeline.setTierFilter}
          onStatusFilterChange={pipeline.setStatusFilter}
          onCategoryFilterChange={pipeline.setCategoryFilter}
          onSearchFilterChange={pipeline.setSearchFilter}
          onOpenDetail={handleOpenDetail}
          onPageChange={pipeline.fetchItems}
        />
      )}

      {view === 'detail' && (
        <IntakeDetailView
          detail={detail.detail}
          detailLoading={detail.detailLoading}
          publishPrice={detail.publishPrice}
          setPublishPrice={detail.setPublishPrice}
          publishing={detail.publishing}
          showTierChange={detail.showTierChange}
          setShowTierChange={detail.setShowTierChange}
          newTier={detail.newTier}
          setNewTier={detail.setNewTier}
          tierChangeReason={detail.tierChangeReason}
          setTierChangeReason={detail.setTierChangeReason}
          tierChanging={detail.tierChanging}
          onBack={handleBackToPipeline}
          onRefresh={() => detail.selectedId && detail.fetchDetail(detail.selectedId)}
          checklistError={detail.checklistError}
          checklistPendingItems={detail.pendingItems}
          onSetChecklistResult={detail.setChecklistResult}
          onMarkAllRequired={detail.markAllRequired}
          onStartQc={detail.startQc}
          startingQc={detail.startingQc}
          onPublish={detail.handlePublish}
          onTierChange={detail.handleTierChange}
        />
      )}
    </div>
  )
}
