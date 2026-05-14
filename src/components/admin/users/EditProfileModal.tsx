'use client'

/**
 * Modal for editing user profile (name, email)
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import type { UserRow } from './types'

interface EditProfileModalProps {
  user: UserRow
  editName: string
  editEmail: string
  isSaving: boolean
  error: string | null
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onSave: () => void
  onClose: () => void
}

export function EditProfileModal({
  user,
  editName,
  editEmail,
  isSaving,
  error,
  onNameChange,
  onEmailChange,
  onSave,
  onClose,
}: EditProfileModalProps) {
  return (
    <Modal isOpen onClose={onClose} title="Benutzer bearbeiten" size="sm">
      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <FormField label="Name" htmlFor="edit-profile-name">
          <Input
            id="edit-profile-name"
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Name eingeben"
          />
        </FormField>

        <FormField label="E-Mail" htmlFor="edit-profile-email">
          <Input
            id="edit-profile-email"
            type="email"
            value={editEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="E-Mail eingeben"
          />
        </FormField>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} variant="outline" size="sm">
          Abbrechen
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Speichern
        </Button>
      </div>
    </Modal>
  )
}
