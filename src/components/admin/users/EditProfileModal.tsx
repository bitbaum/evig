'use client'

/**
 * Modal for editing user profile (name, email)
 */

import { X, Loader2 } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
        <div role="dialog" aria-modal="true" aria-labelledby="edit-profile-dialog-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 id="edit-profile-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Benutzer bearbeiten
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
        </div>
      </div>
    </div>
  )
}
