'use client'

/**
 * Generic form state management hook — SINGLE SOURCE OF TRUTH
 *
 * Replaces the duplicated loading/error/success + fetch + redirect pattern
 * found across 10+ form hooks (blog, location, service, product, workshop, etc.)
 *
 * Usage:
 *   const form = useFormHandler<ServiceFormData>({
 *     initialData: { name: '', slug: '' },
 *     apiEndpoint: '/api/admin/services',
 *     isEdit: true,
 *     editId: '123',
 *     editMethod: 'PUT',
 *     redirectTo: '/admin/services',
 *     successMessage: 'Dienstleistung gespeichert!',
 *   })
 *
 *   // In JSX:
 *   <form onSubmit={form.handleSubmit}>
 *     <input value={form.data.name} onChange={e => form.updateField('name', e.target.value)} />
 *     {form.error && <p>{form.error}</p>}
 *     <button disabled={form.isSubmitting}>Speichern</button>
 *   </form>
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { ERROR_MESSAGES } from '@/config/error-messages'

export interface UseFormHandlerOptions<T> {
  /** Initial form data */
  initialData: T
  /** API endpoint for submit (base URL without ID) */
  apiEndpoint: string
  /** Whether editing existing resource */
  isEdit?: boolean
  /** Resource ID for edit mode */
  editId?: string
  /** HTTP method for create (default: POST) */
  createMethod?: 'POST' | 'PUT' | 'PATCH'
  /** HTTP method for edit (default: PUT) */
  editMethod?: 'PUT' | 'PATCH'
  /** Redirect path after success (optional) */
  redirectTo?: string
  /** Redirect delay in ms (default: 1000) */
  redirectDelay?: number
  /** Success message for create */
  createSuccessMessage?: string
  /** Success message for edit */
  editSuccessMessage?: string
  /** Transform data before submit (optional) */
  transformBeforeSubmit?: (data: T) => unknown
  /** Validation before submit (optional). Return error message or null */
  validate?: (data: T) => string | null
  /** Callback on success (optional) */
  onSuccess?: (responseData: unknown) => void
}

export interface FormHandlerReturn<T> {
  data: T
  setData: React.Dispatch<React.SetStateAction<T>>
  updateField: <K extends keyof T>(field: K, value: T[K]) => void
  isSubmitting: boolean
  error: string
  success: string
  setError: (error: string) => void
  setSuccess: (success: string) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  /** Submit with custom payload (bypasses transformBeforeSubmit) */
  submitCustom: (payload: unknown) => Promise<boolean>
  reset: () => void
}

export function useFormHandler<T extends object>(
  options: UseFormHandlerOptions<T>
): FormHandlerReturn<T> {
  const {
    initialData,
    apiEndpoint,
    isEdit = false,
    editId,
    createMethod = 'POST',
    editMethod = 'PUT',
    redirectTo,
    redirectDelay = 1000,
    createSuccessMessage = 'Erfolgreich erstellt!',
    editSuccessMessage = 'Erfolgreich gespeichert!',
    transformBeforeSubmit,
    validate,
    onSuccess,
  } = options

  const router = useRouter()
  const [data, setData] = useState<T>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const doSubmit = useCallback(async (payload: unknown): Promise<boolean> => {
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const url = isEdit && editId ? `${apiEndpoint}/${editId}` : apiEndpoint
      const method = isEdit ? editMethod : createMethod

      const result = await apiFetch(url, { method, body: payload })

      if (!result.success) {
        setError(result.error || 'Speichern fehlgeschlagen')
        return false
      }

      const msg = isEdit ? editSuccessMessage : createSuccessMessage
      setSuccess(msg)

      if (onSuccess) onSuccess(result.data)

      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo)
          router.refresh()
        }, redirectDelay)
      }

      return true
    } catch {
      setError(ERROR_MESSAGES.UNEXPECTED_ERROR)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [isEdit, editId, apiEndpoint, editMethod, createMethod, editSuccessMessage, createSuccessMessage, onSuccess, redirectTo, redirectDelay, router])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (validate) {
      const validationError = validate(data)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    const payload = transformBeforeSubmit ? transformBeforeSubmit(data) : data
    await doSubmit(payload)
  }, [data, validate, transformBeforeSubmit, doSubmit])

  const submitCustom = useCallback(async (payload: unknown): Promise<boolean> => {
    return doSubmit(payload)
  }, [doSubmit])

  const reset = useCallback(() => {
    setData(initialData)
    setError('')
    setSuccess('')
  }, [initialData])

  return {
    data,
    setData,
    updateField,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    handleSubmit,
    submitCustom,
    reset,
  }
}
