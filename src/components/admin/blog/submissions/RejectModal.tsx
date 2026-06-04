'use client'

import { Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

interface RejectModalProps {
  rejectionReason: string
  actionLoading: string | null
  onReasonChange: (reason: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function RejectModal({
  rejectionReason,
  actionLoading,
  onReasonChange,
  onConfirm,
  onClose,
}: RejectModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-base rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <Heading level={3} className="text-lg text-text-primary mb-4">
          Einreichung ablehnen
        </Heading>
        <FormField label="Ablehnungsgrund" required className="mb-4">
          <Textarea
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            placeholder="Warum wird diese Einreichung abgelehnt?"
          />
        </FormField>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!rejectionReason || actionLoading !== null}
            variant="destructive"
            className="flex-1"
          >
            {actionLoading === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Ablehnen'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
