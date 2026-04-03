'use client'

/**
 * Add Activity Modal
 *
 * Modal for creating a new manual activity update
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
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
        <div id="activity-modal-error" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label htmlFor="activity-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Art der Aktivität
          </label>
          <select
            id="activity-type"
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label htmlFor="activity-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titel <span className="text-red-500">*</span>
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Beschreibung
          </label>
          <textarea
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Weitere Details (optional)"
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="activity-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategorie
          </label>
          <select
            id="activity-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label htmlFor="activity-visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sichtbarkeit
          </label>
          <select
            id="activity-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {VISIBILITY_OPTIONS.map((vis) => (
              <option key={vis} value={vis}>
                {VISIBILITY_LABELS[vis as VisibilityLevel]}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Hinzufügen
          </button>
        </div>
      </form>
    </Modal>
  )
}
