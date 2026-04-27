'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import {
  ArrowLeft,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { useListingDetail } from './useListingDetail'
import { useListingActions } from './useListingActions'
import { ListingImageGallery } from './ListingImageGallery'
import { ListingInfoPanel } from './ListingInfoPanel'
import { ListingActionButtons } from './ListingActionButtons'
import { ListingSellerCard } from './ListingSellerCard'
import { ListingDetails } from './ListingDetails'
import { ReportModal } from './ReportModal'
import { SimilarListings } from './SimilarListings'
import type { ListingImageData } from './types'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const [selectedImage, setSelectedImage] = useState(0)
  const t = useTranslations('marketplace')

  const {
    listing,
    isLoading,
    error,
    isFavorited,
    setIsFavorited,
    favoriteCount,
    setFavoriteCount,
    similarListings,
  } = useListingDetail(params)

  const sessionUserId = session?.user?.id
  const actions = useListingActions({
    listing,
    sessionUserId,
    isFavorited,
    setIsFavorited,
    setFavoriteCount,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('listing.loading')}</span>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <Heading level={2} className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {error || t('listing.notFound')}
        </Heading>
        <Link href="/marketplace" className="text-green-600 hover:text-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1">
          {t('listing.backToMarketplace')}
        </Link>
      </div>
    )
  }

  const sellerName = listing.seller_display_name || listing.seller_name
  const images: ListingImageData[] = listing.images.length > 0
    ? listing.images
    : [{ id: 'placeholder', url: '', position: 0, is_primary: true }]
  const isOwner = sessionUserId === listing.seller_id
  const isGratis = Number(listing.price_chf) === 0
  const isVerified = !!listing.verified_at

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('listing.backToMarketplace')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <ListingImageGallery
          images={images}
          title={listing.title}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
        />

        <div className="space-y-4">
          <ListingInfoPanel listing={listing} isVerified={isVerified} isGratis={isGratis} />

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
            onShowReportModal={() => actions.setShowReportModal(true)}
          />

          <ListingSellerCard listing={listing} sellerName={sellerName} />

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
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
        />
      )}

      <SimilarListings listings={similarListings} />
    </div>
  )
}
