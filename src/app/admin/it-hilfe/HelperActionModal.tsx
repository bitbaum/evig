// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helper action modal (verify / suspend / reactivate)
// ---------------------------------------------------------------------------

import { X, Loader2 } from 'lucide-react'

interface HelperActionModalProps {
  helperAction: string
  helperNotes: string
  setHelperNotes: React.Dispatch<React.SetStateAction<string>>
  actionLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function HelperActionModal({
  helperAction, helperNotes, setHelperNotes, actionLoading, onConfirm, onClose,
}: HelperActionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {helperAction === 'verify' ? 'Helfer verifizieren' : helperAction === 'suspend' ? 'Helfer sperren' : 'Helfer reaktivieren'}
          </h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
            <textarea
              value={helperNotes}
              onChange={e => setHelperNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Begründung (optional)..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
            <button
              onClick={onConfirm}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                helperAction === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bestätigen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
