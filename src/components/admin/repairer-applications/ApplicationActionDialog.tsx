import type { ActionDialogState } from './types'
import Heading from '@/components/admin/AdminHeading'

const DIALOG_TITLES: Record<ActionDialogState['type'], string> = {
  approve_app: 'Bewerbung genehmigen',
  reject_app: 'Bewerbung ablehnen',
  request_changes: 'Änderungen anfordern',
  approve_doc: 'Dokument genehmigen',
  reject_doc: 'Dokument ablehnen',
  verify_cert: 'Zertifizierung verifizieren',
  reject_cert: 'Zertifizierung ablehnen',
}

const REASON_REQUIRED_TYPES = ['reject_app', 'request_changes', 'reject_doc', 'reject_cert']

interface Props {
  dialog: ActionDialogState
  onDialogChange: (dialog: ActionDialogState | null) => void
  onSubmit: () => void
  onClose: () => void
}

export function ApplicationActionDialog({ dialog, onDialogChange, onSubmit, onClose }: Props) {
  const needsReason = REASON_REQUIRED_TYPES.includes(dialog.type)

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300 p-6">
      <Heading level={3} className="text-lg text-neutral-900 mb-4">
        {DIALOG_TITLES[dialog.type]}
      </Heading>

      {needsReason && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {dialog.type === 'request_changes' ? 'Geforderte Änderungen (erforderlich):' : 'Grund (erforderlich):'}
          </label>
          <textarea
            value={dialog.reason}
            onChange={(e) => onDialogChange({ ...dialog, reason: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        </div>
      )}

      {dialog.type === 'approve_doc' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Ablaufdatum (YYYY-MM-DD, optional):
          </label>
          <input
            type="date"
            value={dialog.expiresAt}
            onChange={(e) => onDialogChange({ ...dialog, expiresAt: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Admin-Notizen (optional):
        </label>
        <textarea
          value={dialog.notes}
          onChange={(e) => onDialogChange({ ...dialog, notes: e.target.value })}
          rows={2}
          placeholder="Optionale Notizen..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={needsReason && !dialog.reason.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bestätigen
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
