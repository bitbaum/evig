'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Star,
  User,
  Shield,
} from 'lucide-react'
import type { ListingDetail } from './types'

interface ListingSellerCardProps {
  listing: ListingDetail
  sellerName: string
}

export function ListingSellerCard({ listing, sellerName }: ListingSellerCardProps) {
  return (
    <Link
      href={`/sellers/${listing.seller_id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-green-200 dark:hover:ring-green-800 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verkäufer</h3>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          {listing.seller_avatar_url ? (
            <Image src={listing.seller_avatar_url} alt="Verkäufer" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
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
  )
}
