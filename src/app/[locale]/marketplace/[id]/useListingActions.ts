'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UI_FEEDBACK_MS } from '@/config/limits'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { ListingDetail } from './types'

interface UseListingActionsProps {
  listing: ListingDetail | null
  sessionUserId: string | undefined
  isFavorited: boolean
  setIsFavorited: (v: boolean) => void
  setFavoriteCount: (v: number) => void
}

interface UseListingActionsReturn {
  // Favorite
  togglingFav: boolean
  toggleFavorite: () => Promise<void>
  // Message
  showMessageForm: boolean
  setShowMessageForm: (v: boolean) => void
  contactMessage: string
  setContactMessage: (v: string) => void
  sendingMessage: boolean
  messageSent: boolean
  sendMessage: () => Promise<void>
  // Share
  shareConfirm: boolean
  handleShare: () => Promise<void>
  // Report
  showReportModal: boolean
  setShowReportModal: (v: boolean) => void
  reportReason: string
  setReportReason: (v: string) => void
  reportDetails: string
  setReportDetails: (v: string) => void
  reportSending: boolean
  reportSent: boolean
  setReportSent: (v: boolean) => void
  handleReport: () => Promise<void>
  closeReportModal: () => void
  // Error feedback
  actionError: string | null
  clearActionError: () => void
}

export function useListingActions({
  listing,
  sessionUserId,
  isFavorited: _isFavorited,
  setIsFavorited,
  setFavoriteCount,
}: UseListingActionsProps): UseListingActionsReturn {
  const t = useTranslations('marketplace.listing_actions')
  const router = useRouter()

  // Favorite state
  const [togglingFav, setTogglingFav] = useState(false)

  // Message state
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  // Share state
  const [shareConfirm, setShareConfirm] = useState(false)

  // Report state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  // Error feedback
  const [actionError, setActionError] = useState<string | null>(null)

  const toggleFavorite = async () => {
    if (!sessionUserId || !listing || togglingFav) return
    setTogglingFav(true)
    setActionError(null)
    try {
      const result = await apiFetch<{ favorited: boolean; favorite_count: number }>(`/api/listings/${listing.id}/favorite`, { method: 'POST' })
      if (result.success) {
        setIsFavorited(result.data!.favorited)
        setFavoriteCount(result.data!.favorite_count)
      } else {
        setActionError(result.error || t('errorFavorite'))
      }
    } catch (err) {
      logger.warn('Failed to toggle listing favorite', { error: err })
      setActionError(t('errorNetworkFavorite'))
    } finally {
      setTogglingFav(false)
    }
  }

  const sendMessage = async () => {
    if (!sessionUserId) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (!listing || sendingMessage || !contactMessage.trim()) return
    setSendingMessage(true)
    setActionError(null)
    try {
      const result = await apiFetch<void>(`/api/listings/${listing.id}/contact`, {
        method: 'POST',
        body: { message: contactMessage.trim() },
      })
      if (result.success) {
        setMessageSent(true)
        setContactMessage('')
      } else {
        setActionError(result.error || t('errorMessage'))
      }
    } catch (err) {
      logger.warn('Failed to send listing message', { error: err })
      setActionError(t('errorNetworkMessage'))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.title, url })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareConfirm(true)
      setTimeout(() => setShareConfirm(false), UI_FEEDBACK_MS.COPY)
    }
  }

  const handleReport = async () => {
    if (!listing || !reportReason || reportSending) return
    setReportSending(true)
    setActionError(null)
    try {
      const result = await apiFetch<void>(`/api/listings/${listing.id}/report`, {
        method: 'POST',
        body: {
          reason: reportReason,
          details: reportDetails.trim() || null,
        },
      })
      if (result.success) {
        setReportSent(true)
      } else {
        setActionError(result.error || t('errorReport'))
      }
    } catch (err) {
      logger.warn('Failed to submit listing report', { error: err })
      setActionError(t('errorNetworkReport'))
    } finally {
      setReportSending(false)
    }
  }

  const closeReportModal = () => {
    setShowReportModal(false)
    setReportReason('')
    setReportDetails('')
    setReportSent(false)
  }

  return {
    togglingFav,
    toggleFavorite,
    showMessageForm,
    setShowMessageForm,
    contactMessage,
    setContactMessage,
    sendingMessage,
    messageSent,
    sendMessage,
    shareConfirm,
    handleShare,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    reportDetails,
    setReportDetails,
    reportSending,
    reportSent,
    setReportSent,
    handleReport,
    closeReportModal,
    actionError,
    clearActionError: () => setActionError(null),
  }
}
