'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
  const t = useTranslations('admin.marketplace.handleReportModal')
  const tForms = useTranslations('admin.forms')
  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('actionLabel')}</label>
          <Select variant="elevated" value={reportAction} onChange={e => setReportAction(e.target.value)}>
            <option value="dismiss">{t('actionDismiss')}</option>
            <option value="warn_seller">{t('actionWarnSeller')}</option>
            <option value="remove_listing">{t('actionRemoveListing')}</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('notesLabel')}</label>
          <Textarea
            variant="elevated"
            value={reportNotes}
            onChange={e => setReportNotes(e.target.value)}
            rows={3}
            placeholder={t('notesPlaceholder')}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" size="sm">{tForms('cancel')}</Button>
          <Button onClick={onSubmit} disabled={reportLoading} size="sm">
            {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('execute')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
