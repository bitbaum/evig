'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useIntakePipeline } from './useIntakePipeline'
import { useIntakeDetail } from './useIntakeDetail'
import { useIntakeCreateForm } from './useIntakeCreateForm'
import { IntakePipelineView } from './IntakePipelineView'
import { IntakeCreateForm } from './IntakeCreateForm'
import { IntakeDetailView } from './IntakeDetailView'

export default function IntakeClient() {
  const [view, setView] = useState<'pipeline' | 'create' | 'detail'>('pipeline')

  const pipeline = useIntakePipeline(view === 'pipeline')
  const detail = useIntakeDetail()
  const createForm = useIntakeCreateForm()

  // URL param pre-fill for donation cross-link
  const searchParams = useSearchParams()
  useEffect(() => {
    const donorName = searchParams.get('donor_name')
    const donorEmail = searchParams.get('donor_email')
    const donationId = searchParams.get('donation_id')
    if (donationId || donorName || donorEmail) {
      setView('create')
      createForm.prefillFromDonation(donorName || '', donorEmail || '')
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

  const handleCreate = () => {
    createForm.handleCreate((inventoryId) => {
      // After intake save, immediately open checklist/detail for the new item
      // so the staff member can complete the checklist in one flow
      if (inventoryId) {
        handleOpenDetail(inventoryId)
      } else {
        setView('pipeline')
        pipeline.fetchItems()
      }
    })
  }

  return (
    <div>
      {view === 'pipeline' && (
        <IntakePipelineView
          items={pipeline.items}
          loading={pipeline.loading}
          pagination={pipeline.pagination}
          tierFilter={pipeline.tierFilter}
          statusFilter={pipeline.statusFilter}
          categoryFilter={pipeline.categoryFilter}
          searchFilter={pipeline.searchFilter}
          onTierFilterChange={pipeline.setTierFilter}
          onStatusFilterChange={pipeline.setStatusFilter}
          onCategoryFilterChange={pipeline.setCategoryFilter}
          onSearchFilterChange={pipeline.setSearchFilter}
          onCreateNew={() => setView('create')}
          onOpenDetail={handleOpenDetail}
          onPageChange={pipeline.fetchItems}
        />
      )}

      {view === 'create' && (
        <IntakeCreateForm
          formData={createForm.formData}
          setFormData={createForm.setFormData}
          saving={createForm.saving}
          aiTab={createForm.aiTab}
          setAiTab={createForm.setAiTab}
          aiText={createForm.aiText}
          setAiText={createForm.setAiText}
          aiLoading={createForm.aiLoading}
          aiError={createForm.aiError}
          aiOpen={createForm.aiOpen}
          setAiOpen={createForm.setAiOpen}
          voiceState={createForm.voiceState}
          onAiTextExtract={createForm.handleAiTextExtract}
          onStartVoiceRecording={createForm.startVoiceRecording}
          onStopVoiceRecording={createForm.stopVoiceRecording}
          onPhotoAnalysis={createForm.handlePhotoAnalysis}
          onCreate={handleCreate}
          onCancel={() => setView('pipeline')}
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
          onToggleChecklist={detail.toggleChecklist}
          onMarkAllRequired={detail.markAllRequired}
          onPublish={detail.handlePublish}
          onTierChange={detail.handleTierChange}
        />
      )}
    </div>
  )
}
