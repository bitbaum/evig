'use client'

import { Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

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
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <Heading level={3} className="text-lg text-neutral-900 dark:text-white mb-4">
          Einreichung ablehnen
        </Heading>
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Ablehnungsgrund *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            placeholder="Warum wird diese Einreichung abgelehnt?"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={!rejectionReason || actionLoading !== null}
            className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Ablehnen'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
