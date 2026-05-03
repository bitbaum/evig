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
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Wobei brauchst du Hilfe? <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Brauche Hilfe mit der Kaffeemaschine"
            maxLength={200}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'help-request-error' : undefined}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe das Problem genauer (optional)"
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            An wen richtet sich die Anfrage?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsBroadcast(true)}
              className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                isBroadcast
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Bestimmte Person</span>
            </button>
          </div>
        </div>

        {/* Target user (if not broadcast) */}
        {!isBroadcast && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Person auswählen
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Wähle eine Person...</option>
              {teamMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_name || member.user_email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Dringlichkeit
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {HELP_REQUEST_URGENCY_OPTIONS.map((urg) => (
              <option key={urg} value={urg}>
                {HELP_REQUEST_URGENCY_LABELS[urg as HelpRequestUrgency]}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Kategorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Keine Kategorie</option>
            {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {ACTIVITY_CATEGORY_LABELS[cat as ActivityCategory]}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            Abbrechen
          </button>
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
