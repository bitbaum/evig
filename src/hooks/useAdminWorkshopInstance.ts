'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { WorkshopInstanceWithDetails } from '@/components/workshops/types'

export interface Registration {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  registered_at: string
  attended: boolean
  rating: number | null
  feedback: string | null
}

export function useAdminWorkshopInstance(id: string) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [instance, setInstance] = useState<WorkshopInstanceWithDetails | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInstanceDetails = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ instance: WorkshopInstanceWithDetails; registrations: Registration[] }>(
        `/api/admin/workshops/instances/${id}`,
      )
      if (result.success && result.data) {
        setInstance(result.data.instance)
        setRegistrations(result.data.registrations)
      } else {
        if (result.error) logger.warn('Error loading instance details', { error: result.error })
        setError(result.error || 'Termin nicht gefunden')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
    } else if (sessionStatus === 'authenticated') {
      loadInstanceDetails()
    }
  }, [sessionStatus, router, loadInstanceDetails])

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    const result = await apiFetch<unknown>(`/api/admin/workshops/registrations/${registrationId}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    if (result.success) {
      loadInstanceDetails()
    } else {
      setError(result.error || 'Fehler beim Aktualisieren')
    }
  }

  const isPast = instance ? new Date(instance.start_date) < new Date() : false

  return {
    session,
    sessionStatus,
    instance,
    registrations,
    loading,
    error,
    isPast,
    loadInstanceDetails,
    updateRegistrationStatus,
  }
}
