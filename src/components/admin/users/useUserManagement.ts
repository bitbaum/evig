'use client'

/**
 * Hook for user management operations
 * Handles state and API calls for editing/deleting users
 */

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { UserRow } from './types'

interface UseUserManagementReturn {
  // Modal states
  editingUser: UserRow | null
  editingProfile: UserRow | null
  deletingUser: UserRow | null

  // Loading states
  isDeleting: boolean
  isSaving: boolean
  error: string | null

  // Form state
  editName: string
  editEmail: string
  setEditName: (name: string) => void
  setEditEmail: (email: string) => void

  // Actions
  handleEditPermissions: (user: UserRow) => void
  handleEditProfile: (user: UserRow) => void
  handleDeleteClick: (user: UserRow) => void
  handleCloseModal: () => void
  handleSaveProfile: () => Promise<void>
  handleDeleteUser: () => Promise<void>
}

export function useUserManagement(): UseUserManagementReturn {
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editingProfile, setEditingProfile] = useState<UserRow | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit profile form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const handleEditPermissions = (user: UserRow) => {
    setEditingUser(user)
  }

  const handleEditProfile = (user: UserRow) => {
    setEditingProfile(user)
    setEditName(user.name || '')
    setEditEmail(user.email)
    setError(null)
  }

  const handleDeleteClick = (user: UserRow) => {
    setDeletingUser(user)
  }

  const handleCloseModal = () => {
    setEditingUser(null)
    setEditingProfile(null)
    setDeletingUser(null)
    setError(null)
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await apiFetch(`/api/admin/users/${editingProfile.id}`, {
        method: 'PATCH',
        body: {
          name: editName || null,
          email: editEmail,
        },
      })

      if (!result.success) {
        setError(result.error || 'Failed to update user')
        return
      }

      window.location.reload()
    } catch {
      setError('Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await apiFetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      if (!result.success) {
        setError(result.error || 'Failed to delete user')
        return
      }

      window.location.reload()
    } catch {
      setError('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    editingUser,
    editingProfile,
    deletingUser,
    isDeleting,
    isSaving,
    error,
    editName,
    editEmail,
    setEditName,
    setEditEmail,
    handleEditPermissions,
    handleEditProfile,
    handleDeleteClick,
    handleCloseModal,
    handleSaveProfile,
    handleDeleteUser,
  }
}
