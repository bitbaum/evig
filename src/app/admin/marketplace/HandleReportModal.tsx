'use client'

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
  return (
    <Modal isOpen={true} onClose={onClose} title="Meldung bearbeiten" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Aktion</label>
          <Select variant="elevated" value={reportAction} onChange={e => setReportAction(e.target.value)}>
            <option value="dismiss">Abweisen</option>
            <option value="warn_seller">Verkäufer verwarnen</option>
            <option value="remove_listing">Inserat entfernen</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Notizen</label>
          <Textarea
            variant="elevated"
            value={reportNotes}
            onChange={e => setReportNotes(e.target.value)}
            rows={3}
            placeholder="Begründung..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" size="sm">Abbrechen</Button>
          <Button onClick={onSubmit} disabled={reportLoading} size="sm">
            {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ausführen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
