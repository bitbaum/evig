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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
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
        <FormField label="Art der Aktivität" htmlFor="activity-type">
          <Select
            id="activity-type"
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value)}
          >
            {ACTIVITY_UPDATE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {ACTIVITY_UPDATE_TYPE_LABELS[type as ActivityUpdateType]}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Title */}
        <FormField label="Titel" required htmlFor="activity-title">
          <Input
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
          />
        </FormField>

        {/* Description */}
        <FormField label="Beschreibung" htmlFor="activity-description">
          <Textarea
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Weitere Details (optional)"
            maxLength={2000}
            rows={3}
            className="resize-none"
          />
        </FormField>

        {/* Category */}
        <FormField label="Kategorie" htmlFor="activity-category">
          <Select
            id="activity-category"
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

        {/* Visibility */}
        <FormField label="Sichtbarkeit" htmlFor="activity-visibility">
          <Select
            id="activity-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            {VISIBILITY_OPTIONS.map((vis) => (
              <option key={vis} value={vis}>
                {VISIBILITY_LABELS[vis as VisibilityLevel]}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
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
