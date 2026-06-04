'use client'

/**
 * Create Help Request Modal
 *
 * Modal for creating a new help request (broadcast or targeted)
 */

import { useState } from 'react'
import { Loader2, Users, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import {
  HELP_REQUEST_URGENCY_OPTIONS,
  ACTIVITY_CATEGORY_OPTIONS,
  HELP_REQUEST_URGENCY_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  type HelpRequestUrgency,
  type ActivityCategory,
} from '@/config/activity'
import { useHelpRequestMutations } from './useActivityStream'
import { URGENCY_DEFAULT } from '@/config/it-hilfe'

interface TeamMemberOption {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
}

interface CreateHelpRequestModalProps {
  onClose: () => void
  onSuccess: () => void
  teamMembers?: TeamMemberOption[]
}

export function CreateHelpRequestModal({
  onClose,
  onSuccess,
  teamMembers = [],
}: CreateHelpRequestModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [urgency, setUrgency] = useState<string>(URGENCY_DEFAULT)
  const [isBroadcast, setIsBroadcast] = useState(true)
  const [targetUserId, setTargetUserId] = useState<string>('')

  const { saving, error, createRequest } = useHelpRequestMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const result = await createRequest({
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      urgency,
      requested_user_id: isBroadcast ? null : targetUserId || null,
    })

    if (result) {
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Hilfe anfordern">
      {/* Error */}
      {error && (
        <div id="help-request-error" className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <FormField label="Wobei brauchst du Hilfe?" required htmlFor="help-request-title">
          <Input
            id="help-request-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Brauche Hilfe mit der Kaffeemaschine"
            maxLength={200}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'help-request-error' : undefined}
          />
        </FormField>

        {/* Description */}
        <FormField label="Details">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe das Problem genauer (optional)"
            maxLength={2000}
            rows={3}
            className="resize-none"
          />
        </FormField>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            An wen richtet sich die Anfrage?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsBroadcast(true)}
              className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                isBroadcast
                  ? 'border-action bg-action-muted text-action'
                  : 'border hover:border-strong'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">An alle</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBroadcast(false)}
              className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                !isBroadcast
                  ? 'border-action bg-action-muted text-action'
                  : 'border hover:border-strong'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Bestimmte Person</span>
            </button>
          </div>
        </div>

        {/* Target user (if not broadcast) */}
        {!isBroadcast && (
          <FormField label="Person auswählen" htmlFor="help-request-target">
            <Select
              id="help-request-target"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            >
              <option value="">Wähle eine Person...</option>
              {teamMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_name || member.user_email}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {/* Urgency */}
        <FormField label="Dringlichkeit" htmlFor="help-request-urgency">
          <Select
            id="help-request-urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
          >
            {HELP_REQUEST_URGENCY_OPTIONS.map((urg) => (
              <option key={urg} value={urg}>
                {HELP_REQUEST_URGENCY_LABELS[urg as HelpRequestUrgency]}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Category */}
        <FormField label="Kategorie" htmlFor="help-request-category">
          <Select
            id="help-request-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Keine Kategorie</option>
            {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {ACTIVITY_CATEGORY_LABELS[cat as ActivityCategory]}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border">
          <Button type="button" onClick={onClose} variant="ghost" size="sm">
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={saving || !title.trim() || (!isBroadcast && !targetUserId)}
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Anfrage senden
          </Button>
        </div>
      </form>
    </Modal>
  )
}
