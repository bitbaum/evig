// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Edit request modal
// ---------------------------------------------------------------------------

'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { REQUEST_STATUSES, URGENCY_LEVELS } from '@/config/it-hilfe'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
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
  const t = useTranslations('admin.itHilfe.editModal')
  const tForms = useTranslations('admin.forms')
  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="sm">
      <div className="space-y-4">
        <FormField label={t('statusLabel')}>
          <Select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
            {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>

        <FormField label={t('urgencyLabel')}>
          <Select value={editData.urgency} onChange={e => setEditData(d => ({ ...d, urgency: e.target.value }))}>
            {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </FormField>

        <FormField label={t('adminNotesLabel')}>
          <Textarea
            value={editData.admin_notes}
            onChange={e => setEditData(d => ({ ...d, admin_notes: e.target.value }))}
            rows={3}
            placeholder={t('adminNotesPlaceholder')}
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" size="sm">{tForms('cancel')}</Button>
          <Button onClick={onSave} disabled={editLoading} size="sm" variant="primary">
            {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tForms('save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
