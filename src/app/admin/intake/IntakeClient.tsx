'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIntakePipeline } from './useIntakePipeline'
import { useIntakeDetail } from './useIntakeDetail'
import { IntakePipelineView } from './IntakePipelineView'
import { IntakeDetailView } from './IntakeDetailView'
import { ROUTES } from '@/config/routes'

/**
 * Geräte-Eingang — the pipeline of ALL captured devices (list + detail).
 *
 * Capturing happens in ONE place: /admin/erfassung (Schnellerfassung, or
 * Physische Annahme via ?annahme=1). The former inline create form here was
 * a ~700-line duplicate of the erfassung form with its own AI panel — same
 * job, second implementation. It is gone; "Neues Gerät erfassen" routes to
 * the real form and returns here (detail view) after saving.
 */
export default function IntakeClient() {
  const [view, setView] = useState<'pipeline' | 'detail'>('pipeline')
  const router = useRouter()

  const pipeline = useIntakePipeline(view === 'pipeline')
  const detail = useIntakeDetail()

  // URL params: donation cross-link forwards to the capture form (annahme
  // mode) with donor prefill; ?detail= re-opens a device (e.g. returning
  // from an erfassung edit or right after capture).
  const searchParams = useSearchParams()
  useEffect(() => {
    const donorName = searchParams.get('donor_name')
    const donorEmail = searchParams.get('donor_email')
    const donationId = searchParams.get('donation_id')
    const detailId = searchParams.get('detail')
    if (donationId || donorName || donorEmail) {
      const params = new URLSearchParams({ annahme: '1' })
      if (donationId) params.set('donation_id', donationId)
      if (donorName) params.set('donor_name', donorName)
      if (donorEmail) params.set('donor_email', donorEmail)
      router.replace(`${ROUTES.admin.erfassung}?${params.toString()}`)
    } else if (detailId) {
      setView('detail')
      detail.openDetail(detailId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleOpenDetail = (id: string) => {
    setView('detail')
    detail.openDetail(id)
  }

  const handleBackToPipeline = () => {
    setView('pipeline')
    detail.clearDetail()
  }

  const handleCreateNew = () => {
    router.push(`${ROUTES.admin.erfassung}?annahme=1`)
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
          onCreateNew={handleCreateNew}
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
