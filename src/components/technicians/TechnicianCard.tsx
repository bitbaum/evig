'use client'

import Link from 'next/link'
import { MapPin, Star, User, CheckCircle, Users, Sparkles, Euro } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { type TechnicianProfile } from './types'

interface TechnicianCardProps {
  technician: TechnicianProfile
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

export function TechnicianCard({ technician }: TechnicianCardProps) {
  const isProfessional = technician.profileTier === 'professional'
  const displayedSkills = technician.skills.slice(0, 5)
  const remainingSkillsCount = technician.skills.length - 5

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <Link href={`/techniker/${technician.id}`} className="hover:underline">
                <Heading level={3} className="font-semibold text-gray-900">
                  {isProfessional
                    ? (technician.businessName ?? technician.name)
                    : technician.name}
                </Heading>
              </Link>
              {isProfessional && technician.businessName && (
                <p className="text-sm text-gray-500">{technician.name}</p>
              )}
            </div>
          </div>

          {technician.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
              <CheckCircle className="w-3 h-3" />
              Verifiziert
            </span>
          )}
        </div>

        {/* Rating */}
        {technician.averageRating !== null && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={technician.averageRating} />
            <span className="text-sm text-gray-600">
              {technician.averageRating.toFixed(1)}
            </span>
            {technician.totalJobsCompleted > 0 && (
              <span className="text-sm text-gray-500">
                ({technician.totalJobsCompleted} {technician.totalJobsCompleted === 1 ? 'Auftrag' : 'Aufträge'})
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {technician.bio && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{technician.bio}</p>
        )}

        {/* Professional: services offered */}
        {isProfessional && technician.servicesOffered && technician.servicesOffered.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {technician.servicesOffered.slice(0, 3).map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {service}
              </span>
            ))}
            {technician.servicesOffered.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                +{technician.servicesOffered.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Community: skill badges */}
        {!isProfessional && technician.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {skill}
              </span>
            ))}
            {remainingSkillsCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{remainingSkillsCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-6">
        {/* Location */}
        {(technician.city || technician.postalCode) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>
              {[technician.postalCode, technician.city].filter(Boolean).join(' ')}
            </span>
          </div>
        )}

        {/* Pricing badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {technician.acceptsGratis && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <Users className="w-3 h-3" />
              Gratis
            </span>
          )}
          {technician.acceptsKulturlegi && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              <Sparkles className="w-3 h-3" />
              KulturLegi
            </span>
          )}
          {technician.hourlyRateCents && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <Euro className="w-3 h-3" />
              CHF {(technician.hourlyRateCents / 100).toFixed(0)}/h
            </span>
          )}
          {!technician.hourlyRateCents && !technician.acceptsGratis && (
            <span className="text-sm text-gray-500">Preis auf Anfrage</span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/techniker/${technician.id}`}
          className="block w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
        >
          Profil ansehen
        </Link>
      </div>
    </div>
  )
}

interface TechnicianCardGridProps {
  children: React.ReactNode
}

export function TechnicianCardGrid({ children }: TechnicianCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  )
}
