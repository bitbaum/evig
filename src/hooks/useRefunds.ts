'use client'

import { useState, useCallback } from 'react'

interface Refund {
  id: string
  refund_number: string
  amount_cents: number
  currency: string
  reason: string
  reason_details?: string
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'rejected'
  customer_name: string
  customer_email: string
  original_amount: number
  refund_amount: number
  requested_by_name: string
  approved_by_name?: string
  created_at: string
  approved_at?: string
  processed_at?: string
}

type RefundAction = 'approve' | 'reject' | 'process'

export type { Refund, RefundAction }

export function useRefunds() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const fetchRefunds = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/refunds')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load refunds')
      }

      setRefunds(result.refunds)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateRefund = useCallback(async (refundId: string, action: RefundAction, notes?: string) => {
    try {
      setProcessingId(refundId)
      setError('')

      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} refund`)
      }

      // Update local state
      setRefunds(prev => prev.map(refund =>
        refund.id === refundId
          ? { ...refund, ...result.refund }
          : refund
      ))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setProcessingId(null)
    }
  }, [])

  return {
    refunds,
    isLoading,
    processingId,
    error,
    fetchRefunds,
    updateRefund,
  }
}
