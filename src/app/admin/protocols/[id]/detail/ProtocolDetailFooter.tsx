'use client'

/** Page-tail slice — footer actions, empty state, and the finalize/delete confirm dialogs. */

import type { ComponentProps } from 'react'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import type { ProtocolDetail, StructuredNotes } from '@/lib/schemas/protocols'
import { ProtocolFooterActions } from './ProtocolFooterActions'
import { ProtocolEmptyState } from './ProtocolEmptyState'
import { ProtocolFinalizeDialog } from './ProtocolFinalizeDialog'
import { ProtocolDeleteDialog } from './ProtocolDeleteDialog'

interface ProtocolDetailFooterProps {
  protocol: ProtocolDetail
  notes: StructuredNotes | null
  isDraft: boolean
  isReview: boolean
  isProtocolCreator: boolean
  isSuperAdmin: boolean
  finalizeBlockers: ComponentProps<typeof ProtocolFinalizeDialog>['finalizeBlockers']
  showFinalizeDialog: boolean
  setShowFinalizeDialog: (open: boolean) => void
  finalizing: boolean
  handleFinalize: () => void
  showDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  deleting: boolean
  handleDelete: () => void
}

export function ProtocolDetailFooter({
  protocol,
  notes,
  isDraft,
  isReview,
  isProtocolCreator,
  isSuperAdmin,
  finalizeBlockers,
  showFinalizeDialog,
  setShowFinalizeDialog,
  finalizing,
  handleFinalize,
  showDeleteDialog,
  setShowDeleteDialog,
  deleting,
  handleDelete,
}: ProtocolDetailFooterProps) {
  return (
    <>
      {(isReview || isProtocolCreator || isSuperAdmin) && (
        <ProtocolFooterActions
          isReview={isReview}
          isProtocolCreator={isProtocolCreator}
          isSuperAdmin={isSuperAdmin}
          setShowDeleteDialog={setShowDeleteDialog}
          setShowFinalizeDialog={setShowFinalizeDialog}
        />
      )}

      {/* Empty state */}
      {!notes && !isDraft && protocol.status !== PROTOCOL_STATUSES.PROCESSING && (
        <ProtocolEmptyState />
      )}

      <ProtocolFinalizeDialog
        finalizeBlockers={finalizeBlockers}
        showFinalizeDialog={showFinalizeDialog}
        setShowFinalizeDialog={setShowFinalizeDialog}
        finalizing={finalizing}
        handleFinalize={handleFinalize}
      />

      <ProtocolDeleteDialog
        protocol={protocol}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        deleting={deleting}
        handleDelete={handleDelete}
      />
    </>
  )
}
