'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, Eye } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { useListingActions } from './useListingActions'
import { ListingImageGallery } from './ListingImageGallery'
import { ListingInfoPanel } from './ListingInfoPanel'
import { ListingActionButtons } from './ListingActionButtons'
import { ListingSellerCard } from './ListingSellerCard'
import { OsInstallHint } from '@/components/marketplace/OsInstallHint'
import { RevampitTrustStrip } from './RevampitTrustStrip'
import { AddToCartButton } from '@/components/marketplace/cart/AddToCartButton'
import { ListingDetails } from './ListingDetails'
import { ReportModal } from './ReportModal'
import { SimilarListings } from './SimilarListings'
import type { ListingDetail, ListingImageData, SimilarListing } from './types'
import { useTranslations } from 'next-intl'

/**
 * Client island for the listing-detail page. All server-fetched data arrives as
 * `listing`; this component owns only interactivity (image selection, favourite
 * toggle, contact/report/share) and the below-the-fold similar-listings fetch.
 */
export function ListingDetailClient({ listing }: { listing: ListingDetail }) {
  const { data: session } = useSession()
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(listing.is_favorited)
  const [favoriteCount, setFavoriteCount] = useState(listing.favorite_count)
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])
  const t = useTranslations('marketplace')

  const sessionUserId = session?.user?.id
  const actions = useListingActions({
    listing,
    sessionUserId,
    isFavorited,
    setIsFavorited,
    setFavoriteCount,
  })

  // Similar listings are a below-the-fold enhancement with no SEO value, so they
  // load client-side after paint rather than blocking the server render.
  useEffect(() => {
    let cancelled = false
    apiFetch<SimilarListing[]>(`/api/listings/similar?listing_id=${listing.id}&limit=4`)
      .then((r) => {
        if (!cancelled && r.success && r.data) setSimilarListings(r.data)
      })
      .catch((err) => logger.warn('Failed to load similar listings', { error: err }))
    return () => {
      cancelled = true
    }
  }, [listing.id])

  const sellerName = listing.seller_display_name || listing.seller_name || ''
  const images: ListingImageData[] =
    listing.images.length > 0
      ? listing.images
      : [{ id: 'placeholder', url: '', position: 0, is_primary: true }]
  const isOwner = sessionUserId === listing.seller_id
  const isGratis = Number(listing.price_chf) === 0
  const isVerified = !!listing.verified_at

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <ListingImageGallery
          images={images}
          title={listing.title}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
        />

        <div className="space-y-4">
          <ListingInfoPanel listing={listing} isVerified={isVerified} isGratis={isGratis} />

          {/* RevampIT stock = add-to-cart (primary). P2P listings keep the
              direct buy / contact flow in ListingActionButtons below. */}
          {listing.is_revampit && !isOwner && !isGratis && (
            <AddToCartButton
              item={{
                id: listing.id,
                title: listing.title,
                priceChf: Number(listing.price_chf),
                thumbnail: images[0]?.url || null,
                category: listing.category,
                condition: listing.condition,
              }}
            />
          )}

          <ListingActionButtons
            listing={listing}
            isOwner={isOwner}
            sessionUserId={sessionUserId}
            sellerName={sellerName}
            isFavorited={isFavorited}
            favoriteCount={favoriteCount}
            togglingFav={actions.togglingFav}
            onToggleFavorite={actions.toggleFavorite}
            showMessageForm={actions.showMessageForm}
            onShowMessageForm={actions.setShowMessageForm}
            contactMessage={actions.contactMessage}
            onContactMessageChange={actions.setContactMessage}
            sendingMessage={actions.sendingMessage}
            messageSent={actions.messageSent}
            onSendMessage={actions.sendMessage}
            shareConfirm={actions.shareConfirm}
            onShare={actions.handleShare}
            onShowReportModal={() => {
              actions.clearActionError()
              actions.setShowReportModal(true)
            }}
            actionError={actions.actionError}
          />

          <RevampitTrustStrip listing={listing} isVerified={isVerified} />

          <ListingSellerCard listing={listing} sellerName={sellerName} />

          <OsInstallHint category={listing.category} />

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDateShort(listing.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" aria-hidden="true" />
              {t('listing.views_count', { count: listing.view_count })}
            </span>
          </div>
        </div>
      </div>

      <ListingDetails listing={listing} isVerified={isVerified} />

      {actions.showReportModal && (
        <ReportModal
          reportReason={actions.reportReason}
          onReportReasonChange={actions.setReportReason}
          reportDetails={actions.reportDetails}
          onReportDetailsChange={actions.setReportDetails}
          reportSending={actions.reportSending}
          reportSent={actions.reportSent}
          onReport={actions.handleReport}
          onClose={actions.closeReportModal}
          actionError={actions.actionError}
        />
      )}

      <SimilarListings listings={similarListings} />
    </>
  )
}
