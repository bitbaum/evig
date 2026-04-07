'use client'

import { Loader2 } from 'lucide-react'
import { LISTING_STATUS_CONFIG } from '@/config/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'

interface EditListingModalProps {
  editData: { admin_notes: string; status: string }
  setEditData: React.Dispatch<React.SetStateAction<{ admin_notes: string; status: string }>>
  editLoading: boolean
  onSave: () => void
  onClose: () => void
}

export function EditListingModal({ editData, setEditData, editLoading, onSave, onClose }: EditListingModalProps) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Inserat bearbeiten" size="sm">
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
          <Button onClick={onClose} variant="outline" size="sm">Abbrechen</Button>
          <Button onClick={onSave} disabled={editLoading} size="sm">
            {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
