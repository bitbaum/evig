'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'

export interface ServiceAppointment {
  id: string
  service_name: string
  service_slug: string
  description: string | null
  urgency: string
  status: string
  preferred_date: string | null
  confirmed_date: string | null
  price_charged_cents: number | null
  outcome_notes: string | null
  created_at: string
  updated_at: string
}

interface ErrorMessages {
  loadError: string
  cancelFailed: string
  saveError: string
}

// Forward the ?role=repairer query param to /api/appointments so the API
// returns appointments where the current user is the REPAIRER (not the
// customer). Repairer-side notification emails link to
// /dashboard/appointments?role=repairer — without this passthrough they
// landed on their (likely empty) customer-side bookings instead of the
// service appointment the email was about. /api/appointments has
// supported ?role since the route was created; only the hook needed to
// honor it. Any value other than 'repairer' is treated as customer-mode
// (the API's default), so a stray ?role=garbage doesn't break the page.
function buildAppointmentsUrl(roleParam: string | null): string {
  if (roleParam === 'repairer') {
    return '/api/appointments?role=repairer'
  }
  return '/api/appointments'
}

export function useAppointments(errors: ErrorMessages) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const apiUrl = buildAppointmentsUrl(roleParam)
  const callbackUrl = roleParam === 'repairer'
    ? '/dashboard/appointments?role=repairer'
    : '/dashboard/appointments'

  const [appointments, setAppointments] = useState<ServiceAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(
    () => searchParams.get('payment') === 'success'
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editPreferredDate, setEditPreferredDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Strip the ?payment=success param from the URL after capturing it into
  // state. Preserve ?role on the cleaned URL so a repairer who deep-links
  // via the email + a successful payment doesn't get bumped to
  // customer-mode after the banner shows.
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      router.replace(callbackUrl)
    }
  }, [searchParams, router, callbackUrl])

  const fetchAppointments = async () => {
    const result = await apiFetch<{ appointments: ServiceAppointment[] }>(apiUrl)
    if (result.success && result.data) {
      setAppointments(result.data.appointments || [])
    } else {
      setError(result.error || errors.loadError)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }
    if (!session?.user) return
    let cancelled = false
    async function load() {
      const result = await apiFetch<{ appointments: ServiceAppointment[] }>(apiUrl)
      if (cancelled) return
      if (result.success && result.data) {
        setAppointments(result.data.appointments || [])
      } else {
        setError(result.error || errors.loadError)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [session, sessionStatus, router, errors.loadError, apiUrl, callbackUrl])

  const doCancel = async () => {
    if (!pendingCancelId) return
    const id = pendingCancelId
    setPendingCancelId(null)
    const result = await apiFetch<void>(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: { action: 'cancel' },
    })
    if (result.success) {
      fetchAppointments()
    } else {
      setError(result.error || errors.cancelFailed)
    }
  }

  const openEdit = (apt: ServiceAppointment) => {
    setEditingId(apt.id)
    setEditDescription(apt.description || '')
    setEditPreferredDate(
      apt.preferred_date ? new Date(apt.preferred_date).toISOString().slice(0, 16) : ''
    )
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    const payload: { action: string; description: string; preferred_date?: string } = {
      action: 'update',
      description: editDescription,
    }
    if (editPreferredDate) {
      payload.preferred_date = new Date(editPreferredDate).toISOString()
    }
    const result = await apiFetch<void>(`/api/appointments/${editingId}`, {
      method: 'PATCH',
      body: payload,
    })
    if (result.success) {
      setEditingId(null)
      fetchAppointments()
    } else {
      setError(result.error || errors.saveError)
    }
    setSaving(false)
  }

  return {
    appointments,
    loading,
    error,
    paymentSuccess,
    editingId,
    pendingCancelId,
    editDescription,
    editPreferredDate,
    saving,
    sessionStatus,
    setPaymentSuccess,
    setEditingId,
    setPendingCancelId,
    setEditDescription,
    setEditPreferredDate,
    doCancel,
    openEdit,
    saveEdit,
    // Surface to the page so it can pick role-appropriate empty-state
    // copy (a customer-flavored "you haven't booked any services yet"
    // misleads a repairer who arrives from the appointment notification
    // email — they're the service provider, not the booker).
    isRepairerView: roleParam === 'repairer',
  }
}
