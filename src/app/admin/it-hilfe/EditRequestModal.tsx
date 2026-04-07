// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Edit request modal
// ---------------------------------------------------------------------------

import { Loader2 } from 'lucide-react'
import { REQUEST_STATUSES, URGENCY_LEVELS } from '@/config/it-hilfe'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
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
    <Modal isOpen={true} onClose={onClose} title="Anfrage bearbeiten" size="sm">
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
          <Button onClick={onClose} variant="outline" size="sm">Abbrechen</Button>
          <Button onClick={onSave} disabled={editLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
            {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
