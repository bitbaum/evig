"use client"

/**
 * ProductConfirmDialogs — All confirmation dialogs for product management.
 *
 * Purely presentational: receives state and callbacks from useProductActions.
 * Renders delete, unpublish, publish, and bulk delete confirmation dialogs.
 */

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { DeleteTarget, ActionTarget } from './useProductActions'

interface ProductConfirmDialogsProps {
  // Delete
  deleteTarget: DeleteTarget | null
  isDeleting: boolean
  deleteError: string | null
  onConfirmDelete: () => void
  onDismissDelete: () => void

  // Unpublish
  unpublishTarget: ActionTarget | null
  isUnpublishing: boolean
  unpublishError: string | null
  onConfirmUnpublish: () => void
  onDismissUnpublish: () => void

  // Publish
  publishTarget: ActionTarget | null
  isPublishing: boolean
  publishError: string | null
  onConfirmPublish: () => void
  onDismissPublish: () => void

  // Bulk delete
  bulkDeletePending: boolean
  selectedCount: number
  isBulkDeleting: boolean
  bulkDeleteError: string | null
  onConfirmBulkDelete: () => void
  onDismissBulkDelete: () => void
}

export function ProductConfirmDialogs({
  deleteTarget,
  isDeleting,
  deleteError,
  onConfirmDelete,
  onDismissDelete,
  unpublishTarget,
  isUnpublishing,
  unpublishError,
  onConfirmUnpublish,
  onDismissUnpublish,
  publishTarget,
  isPublishing,
  publishError,
  onConfirmPublish,
  onDismissPublish,
  bulkDeletePending,
  selectedCount,
  isBulkDeleting,
  bulkDeleteError,
  onConfirmBulkDelete,
  onDismissBulkDelete,
}: ProductConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Produkt löschen"
        message="Bist du sicher, dass du dieses Produkt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        itemName={deleteTarget?.name}
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        isLoading={isDeleting}
        error={deleteError}
        variant="danger"
        onConfirm={onConfirmDelete}
        onClose={onDismissDelete}
      />

      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Aus Shop entfernen"
        message="Möchtest du dieses Produkt aus dem Shop entfernen? Es bleibt in den erfassten Produkten erhalten und kann jederzeit wieder veröffentlicht werden."
        itemName={unpublishTarget?.name}
        confirmLabel="Aus Shop entfernen"
        cancelLabel="Abbrechen"
        isLoading={isUnpublishing}
        error={unpublishError}
        variant="warning"
        onConfirm={onConfirmUnpublish}
        onClose={onDismissUnpublish}
      />

      <ConfirmDialog
        isOpen={!!publishTarget}
        title="Im Shop veröffentlichen"
        message="Möchtest du dieses Produkt im Shop veröffentlichen? Es wird sofort für Kunden sichtbar."
        itemName={publishTarget?.name}
        confirmLabel="Veröffentlichen"
        cancelLabel="Abbrechen"
        isLoading={isPublishing}
        error={publishError}
        variant="success"
        onConfirm={onConfirmPublish}
        onClose={onDismissPublish}
      />

      <ConfirmDialog
        isOpen={bulkDeletePending}
        title={`${selectedCount} Produkte löschen`}
        message={`Bist du sicher, dass du ${selectedCount} Produkte löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel={`${selectedCount} Produkte löschen`}
        cancelLabel="Abbrechen"
        isLoading={isBulkDeleting}
        error={bulkDeleteError}
        variant="danger"
        onConfirm={onConfirmBulkDelete}
        onClose={onDismissBulkDelete}
      />
    </>
  )
}
