'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { LISTING_STATUS_CONFIG } from '@/config/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

interface EditListingModalProps {
  editData: { admin_notes: string; status: string }
  setEditData: React.Dispatch<React.SetStateAction<{ admin_notes: string; status: string }>>
  editLoading: boolean
  onSave: () => void
  onClose: () => void
}

export function EditListingModal({ editData, setEditData, editLoading, onSave, onClose }: EditListingModalProps) {
  const t = useTranslations('admin.marketplace.editModal')
  const tForms = useTranslations('admin.forms')
  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="sm">
      <div className="space-y-4">
        <FormField label={t('statusLabel')}>
          <Select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
            {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
          <Button onClick={onSave} disabled={editLoading} size="sm">
            {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tForms('save')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
