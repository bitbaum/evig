'use client'

/**
 * Modal for editing user profile (name, email)
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
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
        <div>
          <label htmlFor="edit-profile-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Name
          </label>
          <input
            id="edit-profile-name"
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Name eingeben"
          />
        </div>

        <div>
          <label htmlFor="edit-profile-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            E-Mail
          </label>
          <input
            id="edit-profile-email"
            type="email"
            value={editEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="E-Mail eingeben"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
        >
          Abbrechen
        </button>
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
