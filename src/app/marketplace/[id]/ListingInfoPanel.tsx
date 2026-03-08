'use client'

import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { DELIVERY_LABELS, PAYMENT_MODE_LABELS, formatCHF, getCategoryLabel, GRATIS_CONFIG, VERIFICATION_CONFIG } from '@/config/marketplace'
import type { DeliveryOption, PaymentMode } from '@/config/marketplace'
import type { ListingDetail } from './types'

interface ListingInfoPanelProps {
  listing: ListingDetail
  isVerified: boolean
  isGratis: boolean
}

export function ListingInfoPanel({ listing, isVerified, isGratis }: ListingInfoPanelProps) {
  const conditionBadge = getConditionBadge(listing.condition)

  return (
    <>
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${conditionBadge.color}`}>
          {conditionBadge.label}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {getCategoryLabel(listing.category)}
        </span>
        {isVerified && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${VERIFICATION_CONFIG.badge.color}`}>
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {VERIFICATION_CONFIG.badge.label}
          </span>
        )}
        {listing.is_revampit && !isVerified && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            RevampIT
          </span>
        )}
        {isGratis && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${GRATIS_CONFIG.color}`}>
            {GRATIS_CONFIG.label}
          </span>
        )}
      </div>

      {/* Title & Price */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {listing.title}
        </h1>
        <p className={`text-3xl font-bold ${isGratis ? 'text-teal-600' : 'text-green-600'}`}>
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
    </>
  )
}
