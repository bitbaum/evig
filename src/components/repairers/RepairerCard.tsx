'use client'

import Link from 'next/link'
import { MapPin, Star, User, CheckCircle } from 'lucide-react'
import { type RepairerProfile } from './types'
import { StarRating } from './StarRating'
import Heading from '@/components/ui/Heading'
import { getServiceIcon, formatPrice } from './helpers'

interface RepairerCardProps {
  repairer: RepairerProfile
  onViewReviews: (repairer: RepairerProfile) => void
}

function RatingBreakdown({ repairer }: { repairer: RepairerProfile }) {
  if (!repairer.rating_distribution) return null
  const total = repairer.total_reviews
  if (total === 0) return null

  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = repairer.rating_distribution![stars.toString()] || 0
        const percentage = total > 0 ? (count / total) * 100 : 0

        return (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-gray-600">{stars}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-yellow-400 h-1.5 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-right text-gray-600">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export function RepairerCard({ repairer, onViewReviews }: RepairerCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <Heading level={3} className="font-semibold text-gray-900">
                {repairer.business_name || 'Unbenannter Reparateur'}
              </Heading>
              <div className="flex items-center text-sm text-gray-600">
                {repairer.is_verified && (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                )}
                <span className="capitalize">{repairer.business_type}</span>
              </div>
            </div>
          </div>

          {repairer.is_verified && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verifiziert
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center gap-3">
            <StarRating rating={repairer.average_rating} />
            <span className="ml-1 text-sm text-gray-600">
              {(repairer.average_rating ?? 0).toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">
              ({repairer.total_reviews} Bewertungen)
            </span>
            {repairer.total_reviews > 0 && (
              <button
                onClick={() => onViewReviews(repairer)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Bewertungen anzeigen
              </button>
            )}
          </div>

          {/* Rating Breakdown */}
          {repairer.total_reviews > 0 && <RatingBreakdown repairer={repairer} />}
        </div>

        {/* Description */}
        {repairer.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {repairer.description}
          </p>
        )}

        {/* Services */}
        <div className="flex flex-wrap gap-1 mb-3">
          {repairer.services_offered.slice(0, 3).map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {getServiceIcon(service)}
              <span className="ml-1 capitalize">
                {service.replace('_', ' ').replace('repair', '')}
              </span>
            </span>
          ))}
          {repairer.services_offered.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              +{repairer.services_offered.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-6">
        {/* Location & Distance */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-2" />
          <span>
            {repairer.postal_code} {repairer.city}
          </span>
          {repairer.distance_km && (
            <span className="ml-2 text-blue-600">
              ({(repairer.distance_km ?? 0).toFixed(1)} km entfernt)
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {repairer.hourly_rate_cents
              ? `${formatPrice(repairer.hourly_rate_cents)}/Std`
              : 'Preis auf Anfrage'}
          </div>
          {repairer.service_radius_km && (
            <div className="text-sm text-gray-600">
              {repairer.service_radius_km} km Radius
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/repairers/${repairer.id}`}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
          >
            Profil ansehen
          </Link>
          <Link
            href={`/repairers/${repairer.id}/book`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
          >
            Termin buchen
          </Link>
        </div>
      </div>
    </div>
  )
}
