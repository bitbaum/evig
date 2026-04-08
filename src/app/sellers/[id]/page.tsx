'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  User,
  MapPin,
  Star,
  Package,
  Loader2,
  AlertCircle,
  Calendar,
  ShoppingBag,
} from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface SellerProfile {
  id: string
  user_id: string
  display_name: string | null
  user_name: string
  bio: string | null
  avatar_url: string | null
  city: string | null
  canton: string | null
  total_listings: number
  total_sold: number
  average_rating: number | null
  total_reviews: number
  member_since: string
  listings: Array<{
    id: string
    title: string
    price_chf: number
    category: string
    condition: string
    thumbnail: string | null
    view_count: number
    favorite_count: number
    created_at: string
  }>
  review_stats: {
    average_rating: number | null
    review_count: number
  }
}

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/sellers/${id}`)
        const data = await response.json()

        if (data.success && data.data) {
          const { profile, listings, review_stats } = data.data
          setSeller({
            ...profile,
            member_since: profile.created_at,
            listings,
            review_stats: {
              average_rating: review_stats.average_rating,
              review_count: review_stats.total_reviews,
            },
          })
        } else {
          setError(data.error || 'Verkäufer nicht gefunden')
        }
      } catch {
        setError('Fehler beim Laden des Profils')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSeller()
  }, [params])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Profil wird geladen...</span>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-gray-900 dark:text-white mb-2">
          {error || 'Verkäufer nicht gefunden'}
        </Heading>
        <Link href="/marketplace" className="text-green-600 hover:text-green-700 font-medium">
          Zurück zum Marketplace
        </Link>
      </div>
    )
  }

  const displayName = seller.display_name || seller.user_name
  const rating = seller.review_stats.average_rating ?? seller.average_rating
  const reviewCount = seller.review_stats.review_count || seller.total_reviews

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Marketplace
      </Link>

      {/* Seller Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt={displayName || 'Verkäufer'} width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <Heading level={1} className="text-2xl text-gray-900 dark:text-white">{displayName}</Heading>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {seller.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {seller.city}{seller.canton ? `, ${seller.canton}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Mitglied seit {formatDateShort(seller.member_since)}
              </span>
            </div>
            {seller.bio && (
              <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm">{seller.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {seller.total_listings}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Inserate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {seller.total_sold}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Verkauft</div>
          </div>
          <div className="text-center">
            {rating && Number(rating) > 0 ? (
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Number(rating).toFixed(1)}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-400">—</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {reviewCount > 0 ? `${reviewCount} Bewertungen` : 'Keine Bewertungen'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div>
        <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Aktive Inserate ({seller.listings.length})
        </Heading>

        {seller.listings.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Dieser Verkäufer hat momentan keine aktiven Inserate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {seller.listings.map((listing) => {
              const conditionInfo = getConditionBadge(listing.condition)
              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    {listing.thumbnail ? (
                      <img
                        src={listing.thumbnail}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-green-600 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCHF(Number(listing.price_chf))}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
