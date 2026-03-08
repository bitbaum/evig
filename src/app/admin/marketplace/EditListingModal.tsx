'use client'

import { X, Loader2 } from 'lucide-react'
import { LISTING_STATUS_CONFIG } from '@/config/marketplace'

interface EditListingModalProps {
  editData: { admin_notes: string; status: string }
  setEditData: React.Dispatch<React.SetStateAction<{ admin_notes: string; status: string }>>
  editLoading: boolean
  onSave: () => void
  onClose: () => void
}

export function EditListingModal({ editData, setEditData, editLoading, onSave, onClose }: EditListingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Inserat bearbeiten</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin-Notizen</label>
            <textarea
              value={editData.admin_notes}
              onChange={e => setEditData(d => ({ ...d, admin_notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Interne Notizen..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
            <button onClick={onSave} disabled={editLoading} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
