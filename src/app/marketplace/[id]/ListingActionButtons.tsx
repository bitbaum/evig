'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  MessageSquare,
  Send,
  Shield,
  Loader2,
  Share2,
  Check,
  Flag,
} from 'lucide-react'
import type { ListingDetail } from './types'

interface ListingActionButtonsProps {
  listing: ListingDetail
  isOwner: boolean
  sessionUserId: string | undefined
  sellerName: string
  // Favorite
  isFavorited: boolean
  favoriteCount: number
  togglingFav: boolean
  onToggleFavorite: () => void
  // Message
  showMessageForm: boolean
  onShowMessageForm: (v: boolean) => void
  contactMessage: string
  onContactMessageChange: (v: string) => void
  sendingMessage: boolean
  messageSent: boolean
  onSendMessage: () => void
  // Share
  shareConfirm: boolean
  onShare: () => void
  // Report
  onShowReportModal: () => void
}

export function ListingActionButtons({
  listing,
  isOwner,
  sessionUserId,
  sellerName,
  isFavorited,
  favoriteCount,
  togglingFav,
  onToggleFavorite,
  showMessageForm,
  onShowMessageForm,
  contactMessage,
  onContactMessageChange,
  sendingMessage,
  messageSent,
  onSendMessage,
  shareConfirm,
  onShare,
  onShowReportModal,
}: ListingActionButtonsProps) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      {/* P2P payment info */}
      {!isOwner && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-medium text-sm">
            <Shield className="w-4 h-4" aria-hidden="true" />
            Direkte Zahlung zwischen Käufer und Verkäufer
          </div>
          <p className="text-xs text-green-700 dark:text-green-400">
            TWINT · Banküberweisung · Bar bei Abholung
          </p>
        </div>
      )}
      {!isOwner && (
        <>
          {messageSent ? (
            <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center space-y-2">
              <p className="text-green-700 dark:text-green-400 font-medium">
                Nachricht wurde gesendet!
              </p>
              <Link
                href="/dashboard/messages"
                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-1"
              >
                Zu deinen Nachrichten
              </Link>
            </div>
          ) : showMessageForm ? (
            <div className="w-full space-y-3">
              <textarea
                value={contactMessage}
                onChange={(e) => onContactMessageChange(e.target.value)}
                placeholder={`Hallo ${sellerName}, ich interessiere mich für dieses Inserat...`}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={onSendMessage}
                  disabled={sendingMessage || !contactMessage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 min-h-[44px] rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  Senden
                </button>
                <button
                  onClick={() => {
                    onShowMessageForm(false)
                    onContactMessageChange('')
                  }}
                  className="py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!sessionUserId) {
                  router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
                  return
                }
                onShowMessageForm(true)
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 min-h-[44px] rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              Nachricht senden
            </button>
          )}
        </>
      )}
      <div className="flex gap-3">
        {sessionUserId && (
          <button
            onClick={onToggleFavorite}
            disabled={togglingFav}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              isFavorited
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
            {favoriteCount > 0 ? favoriteCount : 'Merken'}
          </button>
        )}
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          title="Teilen"
        >
          {shareConfirm ? (
            <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
          ) : (
            <Share2 className="w-4 h-4" aria-hidden="true" />
          )}
          {shareConfirm ? 'Kopiert!' : 'Teilen'}
        </button>
        {isOwner && (
          <Link
            href={`/marketplace/sell?edit=${listing.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Bearbeiten
          </Link>
        )}
        {sessionUserId && !isOwner && (
          <button
            onClick={onShowReportModal}
            className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            title="Melden"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
