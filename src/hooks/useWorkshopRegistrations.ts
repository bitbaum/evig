'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { useSwrFetch } from '@/lib/api/swr'

export interface WorkshopRegistration {
  id: string
  workshop_title: string
  workshop_slug: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  attended: boolean
  rating: number | null
  feedback: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

interface UseWorkshopRegistrationsErrors {
  loadError: string
  saveFailed: string
  cancelFailed: string
}

export function useWorkshopRegistrations(errors: UseWorkshopRegistrationsErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // SWR-driven fetch — gated by session presence. When the user isn't
  // logged in, pass null as the key so SWR skips the request entirely
  // (no setState during render, no 401 spam). Mirrors the prior
  // useEffect guard `if (!session?.user) return`.
  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSwrFetch<{ registrations: WorkshopRegistration[] }>(
    session?.user ? '/api/user/workshop-registrations' : null,
  )

  const registrations = data?.registrations ?? []

  // Local UI state independent of the fetch
  const [error, setError] = useState('')
  // Mirrors useAppointments.ts — the paid-workshop flow at
  // /api/workshops/[slug]/register-with-payment uses
  // successRedirectUrl: /dashboard/workshops?payment=success, and the
  // `dashboard.workshops.paymentSuccess` translation key already exists in
  // all 7 locales waiting for a consumer. The page just never rendered the
  // banner. Initializer captures the flag once on mount; the effect below
  // strips the query param via router.replace so refresh/back-nav don't
  // replay the banner.
  const [paymentSuccess, setPaymentSuccess] = useState(
    () => searchParams.get('payment') === 'success',
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editFeedback, setEditFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      router.replace('/dashboard/workshops')
    }
  }, [searchParams, router])

  // Surface SWR fetch errors via the existing `error` field. Local
  // errors (saveFailed / cancelFailed from action handlers) take
  // precedence over the load-error fallback.
  const displayError = error || (swrError ? errors.loadError : '')

  const openEdit = (reg: WorkshopRegistration) => {
    setEditingId(reg.id)
    setEditRating(reg.rating || 5)
    setEditFeedback(reg.feedback || '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    const result = await apiFetch<void>(`/api/workshops/registrations/${editingId}`, {
      method: 'PATCH',
      body: { rating: editRating, feedback: editFeedback },
    })
    if (result.success) {
      setEditingId(null)
      // Revalidate the SWR cache against the same key — the saved
      // rating/feedback is fetched back into the list.
      await mutate()
    } else {
      setError(result.error || errors.saveFailed)
    }
    setSaving(false)
  }

  const doCancel = async () => {
    if (!pendingCancelId) return
    const id = pendingCancelId
    setPendingCancelId(null)
    const result = await apiFetch<void>(`/api/workshops/registrations/${id}`, {
      method: 'PATCH',
      body: { action: 'cancel' },
    })
    if (result.success) {
      await mutate()
    } else {
      setError(result.error || errors.cancelFailed)
    }
  }

  return {
    session,
    sessionStatus,
    registrations,
    loading: isLoading,
    error: displayError,
    paymentSuccess,
    setPaymentSuccess,
    editingId,
    editRating,
    editFeedback,
    saving,
    pendingCancelId,
    setEditingId,
    setEditRating,
    setEditFeedback,
    setPendingCancelId,
    openEdit,
    saveEdit,
    doCancel,
  }
}
