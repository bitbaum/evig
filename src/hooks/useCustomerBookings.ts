'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { BOOKING_STATUS, type BookingStatus } from '@/config/booking-status'

export interface Appointment {
  id: string
  repairer_id: string
  description: string
  device_info: string | null
  preferred_date: string | null
  confirmed_date: string | null
  urgency: string
  status: BookingStatus
  is_home_visit: boolean
  visit_address: string | null
  visit_city: string | null
  quoted_price_chf: number | null
  diagnosis_notes: string | null
  completion_notes: string | null
  customer_rating: number | null
  created_at: string
  repairer_name: string
  business_name: string | null
  service_name: string
}

const DONE_STATUSES: BookingStatus[] = [
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.CANCELLED,
]

interface ErrorMessages {
  loadError: string
  actionError: string
  networkError: string
}

export function useCustomerBookings(errors: ErrorMessages) {
  const { status: sessionStatus } = useSession()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<{ appointmentId: string; open: boolean } | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ appointments: Appointment[] }>('/api/appointments?role=customer')
      if (result.success) {
        setAppointments(result.data!.appointments)
      } else {
        setError(result.error || errors.loadError)
      }
    } catch {
      setError(errors.networkError)
    } finally {
      setLoading(false)
    }
  }, [errors.loadError, errors.networkError])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
    } else if (sessionStatus === 'authenticated') {
      fetchAppointments()
    }
  }, [sessionStatus, router, fetchAppointments])

  const handleAction = async (appointmentId: string, action: string, extraData?: Record<string, unknown>) => {
    setActionLoading(appointmentId)
    try {
      const result = await apiFetch<void>('/api/appointments/' + appointmentId, {
        method: 'PATCH',
        body: { action, ...extraData },
      })
      if (result.success) {
        fetchAppointments()
        setRatingModal(null)
        setRating(5)
        setReview('')
      } else {
        setError(result.error || errors.actionError)
      }
    } catch {
      setError(errors.networkError)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredAppointments = appointments.filter((apt) =>
    activeTab === 'active' ? !DONE_STATUSES.includes(apt.status) : DONE_STATUSES.includes(apt.status)
  )
  const activeCount = appointments.filter((a) => !DONE_STATUSES.includes(a.status)).length
  const needsAction = appointments.filter((a) => a.status === BOOKING_STATUS.QUOTED).length

  return {
    appointments,
    filteredAppointments,
    activeCount,
    needsAction,
    loading,
    error,
    activeTab,
    actionLoading,
    ratingModal,
    rating,
    review,
    sessionStatus,
    setError,
    setActiveTab,
    setRatingModal,
    setRating,
    setReview,
    fetchAppointments,
    handleAction,
  }
}
