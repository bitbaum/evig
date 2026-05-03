'use client'

import { Link } from '@/i18n/navigation'
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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('marketplace.listing_actions')

  return (
    <div className="space-y-3">
      {/* P2P payment info */}
      {!isOwner && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary-800 dark:text-primary-300 font-medium text-sm">
            <Shield className="w-4 h-4" aria-hidden="true" />
            {t('payment_info')}
          </div>
          <p className="text-xs text-primary-700 dark:text-primary-400">
            {t('payment_methods')}
          </p>
        </div>
      )}
      {!isOwner && (
        <>
          {messageSent ? (
            <div className="w-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 text-center space-y-2">
              <p className="text-primary-700 dark:text-primary-400 font-medium">
                {t('messageSent')}
              </p>
              <Link
                href="/dashboard/messages"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
              >
                {t('goToMessages')}
              </Link>
            </div>
          ) : showMessageForm ? (
            <div className="w-full space-y-3">
              <textarea
                value={contactMessage}
                onChange={(e) => onContactMessageChange(e.target.value)}
                placeholder={t('messagePlaceholder', { sellerName })}
                rows={4}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={onSendMessage}
                  disabled={sendingMessage || !contactMessage.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 min-h-[44px] rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {t('sendMessage')}
                </button>
                <button
                  onClick={() => {
                    onShowMessageForm(false)
                    onContactMessageChange('')
                  }}
                  className="py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {t('cancel')}
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
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 min-h-[44px] rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              {t('contactSeller')}
            </button>
          )}
        </>
      )}
      <div className="flex gap-3">
        {sessionUserId && (
          <button
            onClick={onToggleFavorite}
            disabled={togglingFav}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isFavorited
                ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-600'
                : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-error-500 text-error-500' : ''}`} aria-hidden="true" />
            {favoriteCount > 0 ? favoriteCount : t('save')}
          </button>
        )}
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          title={t('share')}
        >
          {shareConfirm ? (
            <Check className="w-4 h-4 text-primary-600" aria-hidden="true" />
          ) : (
            <Share2 className="w-4 h-4" aria-hidden="true" />
          )}
          {shareConfirm ? t('copied') : t('share')}
        </button>
        {isOwner && (
          <Link
            href={`/marketplace/sell?edit=${listing.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('edit')}
          </Link>
        )}
        {sessionUserId && !isOwner && (
          <button
            onClick={onShowReportModal}
            className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            title={t('report')}
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
