'use client'

/** Footer actions slice — delete (creator/super-admin) and finalize (review) buttons. */

import { CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtocolFooterActionsProps {
  isReview: boolean
  isProtocolCreator: boolean
  isSuperAdmin: boolean
  setShowDeleteDialog: (open: boolean) => void
  setShowFinalizeDialog: (open: boolean) => void
}

export function ProtocolFooterActions({
  isReview,
  isProtocolCreator,
  isSuperAdmin,
  setShowDeleteDialog,
  setShowFinalizeDialog,
}: ProtocolFooterActionsProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        {(isProtocolCreator || isSuperAdmin) && (
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </Button>
        )}
      </div>
      {isReview && (
        <Button
          onClick={() => setShowFinalizeDialog(true)}
          className="gap-2 px-6"
        >
          <CheckCircle2 className="w-4 h-4" />
          Protokoll abschliessen
        </Button>
      )}
    </div>
  )
}
