'use client'

/**
 * Confirmation modal for deleting a user
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
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
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-text-secondary mb-2">
          Bist du sicher, dass du diesen Benutzer löschen möchten?
        </p>
        <div className="p-3 bg-surface-raised rounded-lg">
          <p className="font-medium text-text-primary">
            {user.name || 'Kein Name'}
          </p>
          <p className="text-sm text-text-tertiary">
            {user.email}
          </p>
        </div>
        <p className="mt-3 text-sm text-error-600 dark:text-error-400">
          Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers werden permanent gelöscht.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={onClose} variant="ghost" size="sm">
          Abbrechen
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
          Endgültig löschen
        </Button>
      </div>
    </Modal>
  )
}
