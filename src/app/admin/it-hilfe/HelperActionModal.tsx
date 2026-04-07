// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helper action modal (verify / suspend / reactivate)
// ---------------------------------------------------------------------------

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'

interface HelperActionModalProps {
  helperAction: string
  helperNotes: string
  setHelperNotes: React.Dispatch<React.SetStateAction<string>>
  actionLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

const ACTION_TITLES: Record<string, string> = {
  verify: 'Helfer verifizieren',
  suspend: 'Helfer sperren',
  reactivate: 'Helfer reaktivieren',
}

export function HelperActionModal({
  helperAction, helperNotes, setHelperNotes, actionLoading, onConfirm, onClose,
}: HelperActionModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={ACTION_TITLES[helperAction] ?? 'Aktion'}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen</label>
          <textarea
            value={helperNotes}
            onChange={e => setHelperNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Begründung (optional)..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" size="sm">Abbrechen</Button>
          <Button
            onClick={onConfirm}
            disabled={actionLoading}
            size="sm"
            variant={helperAction === 'suspend' ? 'destructive' : 'default'}
            className={helperAction === 'suspend' ? '' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bestätigen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
