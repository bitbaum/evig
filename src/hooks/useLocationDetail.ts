'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'

export interface LocationDetail {
  id: string
  name: string
  type: string
  description: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  canton: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  max_capacity: number | null
  facilities: string[] | null
  accessibility_info: {
    wheelchairAccessible?: boolean
    parkingAvailable?: boolean
    publicTransport?: string
    additionalInfo?: string
  } | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  approval_status: string
  created_at: string
  updated_at: string
  creator_name: string | null
  creator_email: string | null
  total_bookings: string
  upcoming_bookings: string
  last_approval_action: string | null
  last_reviewed_at: string | null
  last_review_notes: string | null
}

export interface LocationBooking {
  id: string
  start_time: string
  end_time: string
  purpose: string | null
  status: string
  booked_by_name: string | null
  booked_by_email: string | null
}

export function useLocationDetail(locationId: string) {
  const { status: sessionStatus } = useSession()

  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [bookings, setBookings] = useState<LocationBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [pendingApprovalAction, setPendingApprovalAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !locationId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await apiFetch<{ location: LocationDetail; recentBookings?: LocationBooking[] }>(
        `/api/locations/${locationId}`,
      )
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setLocation(result.data.location)
        setBookings(result.data.recentBookings || [])
      } else {
        setError(result.error || 'Ort nicht gefunden')
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionStatus, locationId, refreshKey])

  function handleApproval(action: 'approve' | 'reject') {
    setPendingApprovalAction(action)
  }

  async function doApproval(action: 'approve' | 'reject') {
    setActionLoading(true)
    const result = await apiFetch<void>(`/api/locations/${locationId}/approve`, {
      method: 'POST',
      body: {
        action,
        review_notes: action === 'reject' ? 'Administrative Prüfung' : 'Ort genehmigt',
      },
    })
    setActionLoading(false)
    if (result.success) {
      setRefreshKey((k) => k + 1)
    } else {
      setError(result.error || 'Fehler bei der Genehmigung')
    }
  }

  function confirmApproval() {
    const action = pendingApprovalAction!
    setPendingApprovalAction(null)
    doApproval(action)
  }

  function cancelApproval() {
    setPendingApprovalAction(null)
  }

  return {
    location,
    bookings,
    loading,
    error,
    actionLoading,
    sessionStatus,
    pendingApprovalAction,
    handleApproval,
    confirmApproval,
    cancelApproval,
  }
}
