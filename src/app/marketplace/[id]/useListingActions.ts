import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
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
        setActionError(result.error || 'Fehler beim Aktualisieren des Favoriten')
      }
    } catch {
      setActionError('Netzwerkfehler beim Aktualisieren des Favoriten')
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
        setActionError(result.error || 'Fehler beim Senden der Nachricht')
      }
    } catch {
      setActionError('Netzwerkfehler beim Senden der Nachricht')
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
      setTimeout(() => setShareConfirm(false), 2000)
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
        setActionError(result.error || 'Fehler beim Melden des Inserats')
      }
    } catch {
      setActionError('Netzwerkfehler beim Melden des Inserats')
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
