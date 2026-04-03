'use client'

/**
 * Confirmation modal for deleting a user
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
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
    <Modal isOpen onClose={onClose} title="Benutzer löschen" size="sm">
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
    </Modal>
  )
}
