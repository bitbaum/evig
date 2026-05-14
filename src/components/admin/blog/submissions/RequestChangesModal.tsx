'use client'

import { Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

interface RequestChangesModalProps {
  reviewNotes: string
  actionLoading: string | null
  onNotesChange: (notes: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function RequestChangesModal({
  reviewNotes,
  actionLoading,
  onNotesChange,
  onConfirm,
  onClose,
}: RequestChangesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <Heading level={3} className="text-lg text-neutral-900 dark:text-white mb-4">
          Änderungen anfragen
        </Heading>
        <FormField label="Welche Änderungen werden benötigt?" required className="mb-4">
          <Textarea
            value={reviewNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            placeholder="Beschreibe die gewünschten Änderungen..."
          />
        </FormField>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!reviewNotes || actionLoading !== null}
            variant="primary"
            className="flex-1"
          >
            {actionLoading === 'request_changes' ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Senden'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
