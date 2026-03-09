'use client'

import { X, Loader2 } from 'lucide-react'

interface HandleReportModalProps {
  reportAction: string
  setReportAction: (action: string) => void
  reportNotes: string
  setReportNotes: (notes: string) => void
  reportLoading: boolean
  onSubmit: () => void
  onClose: () => void
}

export function HandleReportModal({ reportAction, setReportAction, reportNotes, setReportNotes, reportLoading, onSubmit, onClose }: HandleReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Meldung bearbeiten</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktion</label>
            <select value={reportAction} onChange={e => setReportAction(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <option value="dismiss">Abweisen</option>
              <option value="warn_seller">Verkäufer verwarnen</option>
              <option value="remove_listing">Inserat entfernen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
            <textarea
              value={reportNotes}
              onChange={e => setReportNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Begründung..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
            <button onClick={onSubmit} disabled={reportLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ausführen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
