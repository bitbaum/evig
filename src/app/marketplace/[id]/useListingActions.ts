import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  const toggleFavorite = async () => {
    if (!sessionUserId || !listing || togglingFav) return
    setTogglingFav(true)
    try {
      const response = await fetch(`/api/listings/${listing.id}/favorite`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setIsFavorited(data.data.favorited)
        setFavoriteCount(data.data.favorite_count)
      }
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
    try {
      const response = await fetch(`/api/listings/${listing.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: contactMessage.trim() }),
      })
      const data = await response.json()
      if (data.success) {
        setMessageSent(true)
        setContactMessage('')
      }
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
    try {
      const res = await fetch(`/api/listings/${listing.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReportSent(true)
      }
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
  }
}
