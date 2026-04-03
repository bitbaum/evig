'use client'

/**
 * Modal for editing user profile (name, email)
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
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
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="edit-profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            id="edit-profile-name"
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Name eingeben"
          />
        </div>

        <div>
          <label htmlFor="edit-profile-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-Mail
          </label>
          <input
            id="edit-profile-email"
            type="email"
            value={editEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="E-Mail eingeben"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Abbrechen
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Speichern
        </button>
      </div>
    </Modal>
  )
}
