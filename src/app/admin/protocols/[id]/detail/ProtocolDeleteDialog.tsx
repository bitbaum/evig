'use client'

/** Delete confirm dialog slice — irreversible protocol deletion. */

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { ProtocolDetail } from '@/lib/schemas/protocols'

interface ProtocolDeleteDialogProps {
  protocol: ProtocolDetail
  showDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  deleting: boolean
  handleDelete: () => void
}

export function ProtocolDeleteDialog({
  protocol,
  showDeleteDialog,
  setShowDeleteDialog,
  deleting,
  handleDelete,
}: ProtocolDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={showDeleteDialog}
      title="Protokoll löschen"
      message="Das Protokoll und alle verknüpften Daten (Abstimmungen, Entscheidungen) werden unwiderruflich gelöscht."
      itemName={protocol.title}
      confirmLabel="Löschen"
      cancelLabel="Abbrechen"
      variant="danger"
      isLoading={deleting}
      onConfirm={handleDelete}
      onClose={() => setShowDeleteDialog(false)}
    />
  )
}
