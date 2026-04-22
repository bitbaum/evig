'use client'

import { Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <Heading level={3} className="text-lg text-gray-900 dark:text-white mb-4">
          Änderungen anfragen
        </Heading>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Welche Änderungen werden benötigt? *
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Beschreibe die gewünschten Änderungen..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={!reviewNotes || actionLoading !== null}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'request_changes' ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Senden'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
