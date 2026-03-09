'use client'

/**
 * Confirmation modal for deleting a user
 */

import { X, Loader2 } from 'lucide-react'
import type { UserRow } from './types'

interface DeleteUserModalProps {
  user: UserRow
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

export function DeleteUserModal({
  user,
  isDeleting,
  error,
  onConfirm,
  onClose,
}: DeleteUserModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Benutzer löschen
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

          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?
            </p>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name || 'Kein Name'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers werden permanent gelöscht.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Endgültig löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
