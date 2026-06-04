'use client'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import {
  Heart,
  MessageSquare,
  Send,
  Shield,
  ShoppingCart,
  Loader2,
  Share2,
  Check,
  Flag,
} from 'lucide-react'
import type { ListingDetail } from './types'
import { useTranslations } from 'next-intl'
import { formatCHF, LISTING_STATUS } from '@/config/marketplace'

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

  const isRevampit = listing.is_revampit
  // The contact-seller API and the checkout flow both reject non-ACTIVE
  // listings server-side. Without this guard the UI rendered fully-enabled
  // CTAs that failed silently when clicked (generic "Inserat ist nicht mehr
  // verfügbar" error, no explanation that it was reserved/sold/removed).
  const isAvailable = listing.status === LISTING_STATUS.ACTIVE
  const unavailableLabel =
    listing.status === LISTING_STATUS.RESERVED ? t('unavailableReserved')
    : listing.status === LISTING_STATUS.SOLD ? t('unavailableSold')
    : listing.status === LISTING_STATUS.REMOVED ? t('unavailableRemoved')
    : listing.status === LISTING_STATUS.DRAFT ? t('unavailableDraft')
    : t('unavailableGeneric')

  return (
    <div className="space-y-3">
      {/* Unavailable banner for non-ACTIVE listings (replaces the buy/contact CTAs) */}
      {!isOwner && !isAvailable && (
        <div
          className="w-full bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4 text-center"
          role="status"
        >
          <p className="text-warning-800 dark:text-warning-300 font-medium text-sm">
            {unavailableLabel}
          </p>
        </div>
      )}

      {/* RevampIT direct purchase — only when ACTIVE */}
      {!isOwner && isRevampit && isAvailable && (
        <>
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary-800 dark:text-primary-300 font-medium text-sm">
              <Shield className="w-4 h-4" aria-hidden="true" />
              {t('revampitTrustTitle')}
            </div>
            <p className="text-xs text-primary-700 dark:text-primary-400">
              {t('revampitTrustDesc')}
            </p>
          </div>
          <Link
            href={`/marketplace/checkout/${listing.id}`}
            className="w-full flex items-center justify-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white py-3 px-6 min-h-[44px] rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
          >
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            {t('buyNow')} — {formatCHF(Number(listing.price_chf))}
          </Link>
        </>
      )}

      {/* P2P payment info */}
      {!isOwner && !isRevampit && isAvailable && (
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
      {!isOwner && !isRevampit && isAvailable && (
        <>
          {messageSent ? (
            <div className="w-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 text-center space-y-2">
              <p className="text-primary-700 dark:text-primary-400 font-medium">
                {t('messageSent')}
              </p>
              <Link
                href="/dashboard/messages"
                className="inline-flex items-center gap-1 text-sm text-action hover:text-primary-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
              >
                {t('goToMessages')}
              </Link>
            </div>
          ) : showMessageForm ? (
            <div className="w-full space-y-3">
              <Textarea
                value={contactMessage}
                onChange={(e) => onContactMessageChange(e.target.value)}
                placeholder={t('messagePlaceholder', { sellerName })}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={onSendMessage}
                  disabled={sendingMessage || !contactMessage.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {t('sendMessage')}
                </Button>
                <Button
                  onClick={() => {
                    onShowMessageForm(false)
                    onContactMessageChange('')
                  }}
                  variant="outline"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                if (!sessionUserId) {
                  router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
                  return
                }
                onShowMessageForm(true)
              }}
              variant="primary"
              className="w-full"
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              {t('contactSeller')}
            </Button>
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
                : 'border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-error-500 text-error-500' : ''}`} aria-hidden="true" />
            {favoriteCount > 0 ? favoriteCount : t('save')}
          </button>
        )}
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          title={t('share')}
        >
          {shareConfirm ? (
            <Check className="w-4 h-4 text-action" aria-hidden="true" />
          ) : (
            <Share2 className="w-4 h-4" aria-hidden="true" />
          )}
          {shareConfirm ? t('copied') : t('share')}
        </button>
        {isOwner && (
          <Link
            href={`/marketplace/sell?edit=${listing.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('edit')}
          </Link>
        )}
        {sessionUserId && !isOwner && (
          <button
            onClick={onShowReportModal}
            className="flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            title={t('report')}
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
