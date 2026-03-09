// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Edit request modal
// ---------------------------------------------------------------------------

import { X, Loader2 } from 'lucide-react'
import { REQUEST_STATUSES, URGENCY_LEVELS } from '@/config/it-hilfe'
import type { EditData } from './types'

interface EditRequestModalProps {
  editData: EditData
  setEditData: React.Dispatch<React.SetStateAction<EditData>>
  editLoading: boolean
  onSave: () => void
  onClose: () => void
}

export function EditRequestModal({
  editData, setEditData, editLoading, onSave, onClose,
}: EditRequestModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Anfrage bearbeiten</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dringlichkeit</label>
            <select value={editData.urgency} onChange={e => setEditData(d => ({ ...d, urgency: e.target.value }))} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
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
            <button onClick={onSave} disabled={editLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
