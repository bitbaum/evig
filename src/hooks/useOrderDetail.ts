'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { ORDER_STATUS } from '@/config/marketplace'

export interface OrderLineItem {
  id: string
  listingId: string
  title: string
  unitPriceChf: number
  quantity: number
  thumbnail: string | null
}

export interface OrderDetail {
  id: string
  buyerId: string
  sellerId: string
  /** null for multi-item cart orders — render `items` instead. */
  listingId: string | null
  amountChf: number
  commissionChf: number
  sellerPayoutChf: number
  status: string
  deliveryMethod: string
  shippingAddress: {
    name?: string
    street?: string
    city?: string
    postal_code?: string
    country?: string
    tracking_number?: string
    tracking_url?: string
  } | null
  deliveredAt: string | null
  completedAt: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  listingTitle: string
  thumbnail: string | null
  /** 0 for single-item orders; N line items for cart orders. */
  itemCount: number
  items: OrderLineItem[]
  buyerName: string | null
  buyerEmail: string | null
  sellerName: string | null
  sellerEmail: string | null
  role: 'buyer' | 'seller'
  counterpartyName: string | null
}

export function useOrderDetail(params: Promise<{ id: string }>, errorMessages: {
  notFound: string
  confirmReceipt: string
  updateStatus: string
}) {
  const { status: sessionStatus } = useSession()
  const router = useRouter()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const { id } = await params
        const result = await apiFetch<OrderDetail>(`/api/marketplace/orders/${id}`)
        if (result.success && result.data) {
          setOrder(result.data)
        } else {
          setError(result.error || errorMessages.notFound)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrder()
  }, [params, sessionStatus, router, errorMessages.notFound])

  const confirmReceipt = async () => {
    if (!order || updatingStatus) return
    setUpdatingStatus(true)
    setError(null)
    try {
      const { id } = await params
      const result = await apiFetch<unknown>(`/api/marketplace/orders/${id}/confirm-receipt`, {
        method: 'POST',
      })
      if (result.success) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: ORDER_STATUS.COMPLETED,
                completedAt: new Date().toISOString(),
                deliveredAt: prev.deliveredAt ?? new Date().toISOString(),
              }
            : null,
        )
      } else {
        setError(result.error || errorMessages.confirmReceipt)
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order || updatingStatus) return
    setUpdatingStatus(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { status: newStatus }
      if (newStatus === ORDER_STATUS.SHIPPED && trackingNumber.trim()) {
        body.tracking_number = trackingNumber.trim()
      }
      const { id } = await params
      const result = await apiFetch<unknown>(`/api/marketplace/orders/${id}`, {
        method: 'PATCH',
        body,
      })
      if (result.success) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      } else {
        setError(result.error || errorMessages.updateStatus)
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  const markReviewed = () => {
    setOrder((prev) => (prev ? { ...prev, reviewedAt: new Date().toISOString() } : null))
  }

  return {
    order,
    isLoading,
    error,
    updatingStatus,
    confirmCancel,
    setConfirmCancel,
    trackingNumber,
    setTrackingNumber,
    sessionStatus,
    confirmReceipt,
    updateStatus,
    markReviewed,
  }
}
