'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

export interface OfferWithRequest {
  id: string
  requestId: string
  message: string
  estimatedTime: string | null
  proposedCompensation: string | null
  relevantSkills: string[]
  status: string
  createdAt: string
  request: {
    id: string
    title: string
    categoryId: string
    deviceBrand: string | null
    deviceModel: string | null
    status: string
    city: string
    canton: string
    /** Null only on rows from older code paths; the API always emits it now. */
    expiresAt: string | null
    requesterName: string
  }
}

interface UseMyOffersErrors {
  errorMessage: string
  withdrawError: string
}

export function useMyOffers(errors: UseMyOffersErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [offers, setOffers] = useState<OfferWithRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [pendingWithdraw, setPendingWithdraw] = useState<OfferWithRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/my/offers')
    }
  }, [sessionStatus, router])

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const result = await apiFetch<{ offers: OfferWithRequest[]; total: number }>(
        `/api/it-hilfe/my-offers?${params}`,
      )

      if (result.success && result.data) {
        setOffers(result.data.offers)
        setTotal(result.data.total)
      } else {
        setError(result.error || errors.errorMessage)
        logger.error('Error fetching my offers', { error: result.error })
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, errors.errorMessage])

  useEffect(() => {
    if (session?.user) {
      fetchOffers()
    }
  }, [session?.user, fetchOffers])

  const doWithdraw = async () => {
    const offer = pendingWithdraw
    if (!offer) return
    setPendingWithdraw(null)
    setWithdrawingId(offer.id)
    try {
      const result = await apiFetch<unknown>(
        `/api/it-hilfe/requests/${offer.requestId}/offers/${offer.id}`,
        { method: 'DELETE' },
      )
      if (!result.success) {
        throw new Error(result.error || errors.withdrawError)
      }
      fetchOffers()
    } catch (err) {
      const message = err instanceof Error ? err.message : errors.withdrawError
      setError(message)
      logger.error('Error withdrawing offer', { error: err })
    } finally {
      setWithdrawingId(null)
    }
  }

  return {
    sessionStatus,
    offers,
    loading,
    total,
    statusFilter,
    withdrawingId,
    pendingWithdraw,
    error,
    setStatusFilter,
    setPendingWithdraw,
    doWithdraw,
  }
}
