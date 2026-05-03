'use client'

/**
 * Add Activity Modal
 *
 * Modal for creating a new manual activity update
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import {
  ACTIVITY_UPDATE_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_UPDATE_TYPE_LABELS,
  VISIBILITY_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  type ActivityUpdateType,
  type VisibilityLevel,
  type ActivityCategory,
} from '@/config/activity'
import { useActivityUpdateMutations } from './useActivityStream'

interface AddActivityModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddActivityModal({ onClose, onSuccess }: AddActivityModalProps) {
  const [updateType, setUpdateType] = useState<string>('accomplishment')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [visibility, setVisibility] = useState<string>('team')

  const { saving, error, createUpdate } = useActivityUpdateMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const result = await createUpdate({
      update_type: updateType,
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      visibility,
    })

    if (result) {
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Aktivität hinzufügen">
      {/* Error */}
      {error && (
        <div id="activity-modal-error" className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label htmlFor="activity-type" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Art der Aktivität
          </label>
          <select
            id="activity-type"
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ACTIVITY_UPDATE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {ACTIVITY_UPDATE_TYPE_LABELS[type as ActivityUpdateType]}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="activity-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Titel <span className="text-error-500">*</span>
          </label>
          <input
            id="activity-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Was hast du erreicht?"
            maxLength={200}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'activity-modal-error' : undefined}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="activity-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Beschreibung
          </label>
          <textarea
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Weitere Details (optional)"
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="activity-category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Kategorie
          </label>
          <select
            id="activity-category"
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

        {/* Visibility */}
        <div>
          <label htmlFor="activity-visibility" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Sichtbarkeit
          </label>
          <select
            id="activity-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {VISIBILITY_OPTIONS.map((vis) => (
              <option key={vis} value={vis}>
                {VISIBILITY_LABELS[vis as VisibilityLevel]}
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
            disabled={saving || !title.trim()}
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Hinzufügen
          </Button>
        </div>
      </form>
    </Modal>
  )
}
