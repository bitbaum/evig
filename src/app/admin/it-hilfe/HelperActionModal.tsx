// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helper action modal (verify / suspend / reactivate)
// ---------------------------------------------------------------------------

'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface HelperActionModalProps {
  helperAction: string
  helperNotes: string
  setHelperNotes: React.Dispatch<React.SetStateAction<string>>
  actionLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

const ACTION_TITLE_KEYS: Record<string, 'titleVerify' | 'titleSuspend' | 'titleReactivate'> = {
  verify: 'titleVerify',
  suspend: 'titleSuspend',
  reactivate: 'titleReactivate',
}

export function HelperActionModal({
  helperAction, helperNotes, setHelperNotes, actionLoading, onConfirm, onClose,
}: HelperActionModalProps) {
  const t = useTranslations('admin.itHilfe.helperActionModal')
  const tForms = useTranslations('admin.forms')
  const titleKey = ACTION_TITLE_KEYS[helperAction]
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={titleKey ? t(titleKey) : t('titleDefault')}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('notesLabel')}</label>
          <Textarea
            value={helperNotes}
            onChange={e => setHelperNotes(e.target.value)}
            rows={3}
            variant="elevated"
            placeholder={t('notesPlaceholder')}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" size="sm">{tForms('cancel')}</Button>
          <Button
            onClick={onConfirm}
            disabled={actionLoading}
            size="sm"
            variant={helperAction === 'suspend' ? 'destructive' : 'primary'}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
