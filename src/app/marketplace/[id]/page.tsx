'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  Package,
  User,
  Clock,
  MessageSquare,
  Send,
  Shield,
  Truck,
  CreditCard,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { DELIVERY_LABELS, PAYMENT_MODE_LABELS, formatCHF } from '@/config/marketplace'
import type { DeliveryOption, PaymentMode } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'
import ListingReviews from '@/components/marketplace/ListingReviews'

interface ListingImage {
  id: string
  url: string
  position: number
  is_primary: boolean
}

interface ListingDetail {
  id: string
  seller_id: string
  title: string
  description: string
  price_chf: number
  category: string
  condition: string
  brand: string | null
  model: string | null
  delivery_options: string
  shipping_cost_chf: number | null
  pickup_location: string | null
  payment_mode: string
  status: string
  is_revampit: boolean
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string
  seller_email: string | null
  seller_display_name: string | null
  seller_bio: string | null
  seller_avatar_url: string | null
  seller_city: string | null
  seller_canton: string | null
  seller_rating: number | null
  seller_total_sold: number | null
  seller_total_reviews: number | null
  images: ListingImage[]
  is_favorited: boolean
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [togglingFav, setTogglingFav] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [similarListings, setSimilarListings] = useState<Array<{ id: string; title: string; price_chf: number; condition: string; thumbnail: string | null }>>([])

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/listings/${id}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()

        if (data.success && data.data) {
          setListing(data.data)
          setIsFavorited(data.data.is_favorited)
          setFavoriteCount(data.data.favorite_count)
          // Fetch similar listings
          fetch(`/api/listings/similar?listing_id=${data.data.id}&limit=4`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              return res.json()
            })
            .then(simData => {
              if (simData.success && simData.data) setSimilarListings(simData.data)
            })
            .catch(() => {})
        } else {
          setError(data.error || 'Inserat nicht gefunden')
        }
      } catch {
        setError('Fehler beim Laden des Inserats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [params])

  const toggleFavorite = async () => {
    if (!session?.user || !listing || togglingFav) return
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
    if (!session?.user || !listing || sendingMessage || !contactMessage.trim()) return
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Inserat wird geladen...</span>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {error || 'Inserat nicht gefunden'}
        </h2>
        <Link href="/marketplace" className="text-green-600 hover:text-green-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1">
          Zurück zum Marketplace
        </Link>
      </div>
    )
  }

  const conditionBadge = getConditionBadge(listing.condition)
  const sellerName = listing.seller_display_name || listing.seller_name
  const images = listing.images.length > 0 ? listing.images : [{ id: 'placeholder', url: '', position: 0, is_primary: true }]
  const isOwner = session?.user?.id === listing.seller_id

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Zurück zum Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            {images[selectedImage]?.url ? (
              <img
                src={images[selectedImage].url}
                alt={listing.title}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300 dark:text-gray-500" aria-hidden="true" />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    idx === selectedImage ? 'border-green-500' : 'border-transparent hover:border-gray-300'
                  }`}
                  aria-label={`Bild ${idx + 1} anzeigen`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${conditionBadge.color}`}>
              {conditionBadge.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {listing.category}
            </span>
            {listing.is_revampit && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                RevampIT
              </span>
            )}
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {listing.title}
            </h1>
            <p className="text-3xl font-bold text-green-600">
              {formatCHF(Number(listing.price_chf))}
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            {listing.brand && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Marke</span>
                <span className="font-medium text-gray-900 dark:text-white">{listing.brand}</span>
              </div>
            )}
            {listing.model && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Modell</span>
                <span className="font-medium text-gray-900 dark:text-white">{listing.model}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" aria-hidden="true" /> Lieferung
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {DELIVERY_LABELS[listing.delivery_options as DeliveryOption] || listing.delivery_options}
              </span>
            </div>
            {listing.shipping_cost_chf != null && listing.delivery_options !== 'pickup' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Versandkosten</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCHF(Number(listing.shipping_cost_chf))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> Zahlung
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {PAYMENT_MODE_LABELS[listing.payment_mode as PaymentMode] || listing.payment_mode}
              </span>
            </div>
            {listing.pickup_location && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Standort
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{listing.pickup_location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOwner && listing.payment_mode !== 'direct' && (
              <button
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 min-h-[44px] rounded-lg font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => router.push(`/marketplace/checkout/${listing.id}`)}
              >
                <Shield className="w-5 h-5" aria-hidden="true" />
                Jetzt kaufen (sicher)
              </button>
            )}
            {!isOwner && listing.payment_mode !== 'secure' && (
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
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={`Hallo ${sellerName}, ich interessiere mich für dieses Inserat...`}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={sendMessage}
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
                          setShowMessageForm(false)
                          setContactMessage('')
                        }}
                        className="py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMessageForm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 min-h-[44px] rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <MessageSquare className="w-5 h-5" aria-hidden="true" />
                    Nachricht senden
                  </button>
                )}
              </>
            )}
            <div className="flex gap-3">
              {session?.user && (
                <button
                  onClick={toggleFavorite}
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
              {isOwner && (
                <Link
                  href={`/marketplace/sell?edit=${listing.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Bearbeiten
                </Link>
              )}
            </div>
          </div>

          {/* Seller Card */}
          <Link
            href={`/sellers/${listing.seller_id}`}
            className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-green-200 dark:hover:ring-green-800 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verkäufer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                {listing.seller_avatar_url ? (
                  <img src={listing.seller_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-green-600" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{sellerName}</span>
                  {listing.is_revampit && <Shield className="w-4 h-4 text-blue-500" aria-hidden="true" />}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {listing.seller_rating && Number(listing.seller_rating) > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                      {Number(listing.seller_rating).toFixed(1)}
                      {listing.seller_total_reviews && ` (${listing.seller_total_reviews})`}
                    </span>
                  )}
                  {listing.seller_total_sold != null && Number(listing.seller_total_sold) > 0 && (
                    <span>{listing.seller_total_sold} verkauft</span>
                  )}
                  {listing.seller_city && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" aria-hidden="true" /> {listing.seller_city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDateShort(listing.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" aria-hidden="true" />
              {listing.view_count} Aufrufe
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Beschreibung</h2>
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">
          {listing.description}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <ListingReviews listingId={listing.id} sellerId={listing.seller_id} />
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ähnliche Inserate</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {similarListings.map((sim) => {
              const simCondition = getConditionBadge(sim.condition)
              return (
                <Link
                  key={sim.id}
                  href={`/marketplace/${sim.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <div className="relative aspect-[4/3]">
                    {sim.thumbnail ? (
                      <img src={sim.thumbnail} alt={sim.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-300 dark:text-gray-500" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${simCondition.color}`}>
                        {simCondition.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-green-600 transition-colors">
                      {sim.title}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCHF(Number(sim.price_chf))}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
