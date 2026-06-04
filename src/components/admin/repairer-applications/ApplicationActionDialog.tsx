import type { ActionDialogState } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

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
    <div className="bg-surface-base rounded-lg shadow-lg dark:shadow-black/30 border-2 border-default dark:border-white/6 p-6">
      <Heading level={3} className="text-lg text-text-primary mb-4">
        {DIALOG_TITLES[dialog.type]}
      </Heading>

      {needsReason && (
        <FormField
          label={dialog.type === 'request_changes' ? 'Geforderte Änderungen (erforderlich):' : 'Grund (erforderlich):'}
          className="mb-4"
        >
          <Textarea
            value={dialog.reason}
            onChange={(e) => onDialogChange({ ...dialog, reason: e.target.value })}
            rows={3}
            autoFocus
          />
        </FormField>
      )}

      {dialog.type === 'approve_doc' && (
        <FormField label="Ablaufdatum (YYYY-MM-DD, optional):" className="mb-4">
          <Input
            type="date"
            value={dialog.expiresAt}
            onChange={(e) => onDialogChange({ ...dialog, expiresAt: e.target.value })}
          />
        </FormField>
      )}

      <FormField label="Admin-Notizen (optional):" className="mb-4">
        <Textarea
          value={dialog.notes}
          onChange={(e) => onDialogChange({ ...dialog, notes: e.target.value })}
          rows={2}
          placeholder="Optionale Notizen..."
        />
      </FormField>

      <div className="flex gap-3">
        <Button
          onClick={onSubmit}
          disabled={needsReason && !dialog.reason.trim()}
          variant="primary"
          size="sm"
        >
          Bestätigen
        </Button>
        <Button onClick={onClose} variant="outline" size="sm">
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
