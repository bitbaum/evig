'use client'

import { useState, useCallback } from 'react'

interface CategoryFormData {
  id?: string
  name: string
  slug: string
  description: string
  color: string
  sort_order: number
  is_active: boolean
}

export type { CategoryFormData }

interface UseBlogCategoriesResult {
  saving: boolean
  deleting: boolean
  error: string
  success: string
  saveCategory: (data: CategoryFormData, options: { isEdit: boolean; id?: string }) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  clearMessages: () => void
}

export function useBlogCategories(): UseBlogCategoriesResult {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearMessages = useCallback(() => {
    setError('')
    setSuccess('')
  }, [])

  const saveCategory = useCallback(async (
    data: CategoryFormData,
    options: { isEdit: boolean; id?: string }
  ): Promise<boolean> => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const url = options.isEdit
        ? `/api/admin/blog/categories/${options.id}`
        : '/api/admin/blog/categories'

      const res = await fetch(url, {
        method: options.isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (result.success) {
        setSuccess(options.isEdit ? 'Kategorie gespeichert!' : 'Kategorie erstellt!')
        return true
      } else {
        setError(result.error || 'Fehler beim Speichern')
        return false
      }
    } catch {
      setError('Netzwerkfehler')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (result.success) {
        return true
      } else {
        setError(result.error || 'Fehler beim Löschen')
        return false
      }
    } catch {
      setError('Netzwerkfehler')
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  return {
    saving,
    deleting,
    error,
    success,
    saveCategory,
    deleteCategory,
    clearMessages,
  }
}
