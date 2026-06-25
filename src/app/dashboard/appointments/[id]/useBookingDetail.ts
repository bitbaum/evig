/**
 * State + actions hook for `/dashboard/appointments/[id]`.
 *
 * Owns the appointment fetch, action mutations, and the rating-form
 * local state. Extracted from page.tsx as part of the QQ.3 split so
 * presentation files stay focused.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import type { BookingStatus } from '@/config/booking-status'

export interface AppointmentDetail {
  id: string
  user_id: string
  repairer_id: string | null
  description: string
  device_info: string | null
  preferred_date: string | null
  confirmed_date: string | null
  urgency: string
  status: BookingStatus
  outcome_notes: string | null
  estimated_duration_hours: number | null
  quoted_price_chf: number | null
  diagnosis_notes: string | null
  parts_needed: string | null
  completed_at: string | null
  completion_notes: string | null
  customer_rating: number | null
  customer_review: string | null
  is_home_visit: boolean
  visit_address: string | null
  visit_postal_code: string | null
  visit_city: string | null
  created_at: string
  updated_at: string
  customer_name: string | null
  customer_email: string | null
  repairer_name: string | null
  business_name: string | null
  repairer_phone: string | null
  service_name: string | null
}

export interface BookingDetailState {
  appointment: AppointmentDetail | null
  loading: boolean
  sessionStatus: 'authenticated' | 'unauthenticated' | 'loading'
  error: string | null
  actionLoading: boolean
  showRating: boolean
  rating: number
  review: string
  isCustomer: boolean
  setShowRating: (v: boolean) => void
  setRating: (v: number) => void
  setReview: (v: string) => void
  clearError: () => void
  handleAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  handlePay: () => Promise<void>
}

export function useBookingDetail(id: string): BookingDetailState {
  const t = useTranslations('dashboard.bookings')
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const fetchAppointment = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<{ appointment: AppointmentDetail }>(`/api/appointments/${id}`)
      if (result.success && result.data) {
        setAppointment(result.data.appointment)
      } else {
        setError(result.error || t('loadError'))
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/appointments/${id}`)}`)
      return
    }
    if (sessionStatus === 'authenticated') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data load when session ready
      fetchAppointment()
    }
  }, [sessionStatus, router, fetchAppointment, id])

  const handleAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const result = await apiFetch<void>(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: { action, ...extra },
      })
      if (result.success) {
        await fetchAppointment()
        setShowRating(false)
        setRating(5)
        setReview('')
      } else {
        setError(result.error || t('actionError'))
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setActionLoading(false)
    }
  }, [id, fetchAppointment, t])

  const handlePay = useCallback(async () => {
    setActionLoading(true)
    setError(null)
    try {
      const result = await apiFetch<{ paymentUrl: string }>(`/api/appointments/${id}/pay`, {
        method: 'POST',
        body: { useEscrow: false, autoReleaseDays: 7, paymentType: 'full' },
      })
      if (result.success && result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl
        return
      }
      setError(result.error || t('payError'))
    } catch {
      setError(t('networkError'))
    } finally {
      setActionLoading(false)
    }
  }, [id, t])

  const isCustomer = !!session?.user?.id && session.user.id === appointment?.user_id
  const clearError = useCallback(() => setError(null), [])

  return {
    appointment,
    loading,
    sessionStatus,
    error,
    actionLoading,
    showRating,
    rating,
    review,
    isCustomer,
    setShowRating,
    setRating,
    setReview,
    clearError,
    handleAction,
    handlePay,
  }
}
