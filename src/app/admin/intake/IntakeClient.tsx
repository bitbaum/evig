'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useIntakePipeline } from './useIntakePipeline'
import { useIntakeDetail } from './useIntakeDetail'
import { IntakePipelineView } from './IntakePipelineView'
import { IntakeDetailView } from './IntakeDetailView'
import { QuickIntakeForm, type DonationPrefill } from './QuickIntakeForm'
import { ROUTES } from '@/config/routes'

/**
 * Geräte-Eingang — one operational home for capture, triage, QC and publish.
 *
 * The keyboard-first intake at /admin/intake/capture is deliberately small.
 * Uncommon catalogue fields stay in the advanced /admin/erfassung editor,
 * instead of maintaining two full product forms for the same job.
 */
export default function IntakeClient() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const view = searchParams.has('detail')
    ? 'detail'
    : pathname.endsWith('/capture') ||
        searchParams.get('capture') === '1' ||
        searchParams.has('donation_id') ||
        searchParams.has('donor_name') ||
        searchParams.has('donor_email')
      ? 'capture'
      : 'pipeline'

  const pipeline = useIntakePipeline(view === 'pipeline')
  const detail = useIntakeDetail()

  // URL params: donation cross-links open the fast capture with donor
  // prefill; ?capture=1 opens the same keyboard-first entry point; ?detail=
  // re-opens a device (e.g. a QR scan or return from product editing).
  const donationPrefill: DonationPrefill = {
    id: searchParams.get('donation_id'),
    name: searchParams.get('donor_name') ?? '',
    email: searchParams.get('donor_email') ?? '',
  }
  useEffect(() => {
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
          onSetChecklistResult={detail.setChecklistResult}
          onMarkAllRequired={detail.markAllRequired}
          onStartQc={detail.startQc}
          startingQc={detail.startingQc}
          onPublish={detail.handlePublish}
          onTierChange={detail.handleTierChange}
        />
      )}

      {view === 'capture' && (
        <QuickIntakeForm
          donationPrefill={donationPrefill}
          onCancel={() => router.push(ROUTES.admin.intake)}
          onCreated={() => { void pipeline.fetchItems(0) }}
        />
      )}
    </div>
  )
}
