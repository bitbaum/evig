'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  MapPin,
  Star,
  Wrench,
  User,
  Phone,
  CheckCircle,
  Award,
} from 'lucide-react'
import {
  type RepairerProfile,
  type RepairerService,
  type RepairerReview,
  type AvailabilitySlot,
} from '@/components/repairers/types'
import { StarRating } from '@/components/repairers/StarRating'
import { ServicesTab } from '@/components/repairers/ServicesTab'
import { ReviewsTab } from '@/components/repairers/ReviewsTab'
import { AboutTab } from '@/components/repairers/AboutTab'
import { RepairerSidebar } from '@/components/repairers/RepairerSidebar'

export default function RepairerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [repairer, setRepairer] = useState<RepairerProfile | null>(null)
  const [services, setServices] = useState<RepairerService[]>([])
  const [reviews, setReviews] = useState<RepairerReview[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services')

  useEffect(() => {
    const fetchRepairerDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/repairers/${id}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'Reparateur nicht gefunden')
          return
        }

        setRepairer(data.repairer)
        setServices(data.services || [])
        setReviews(data.reviews || [])
        setAvailability(data.availability || [])
      } catch (err) {
        logger.error('Error fetching repairer details', { error: err })
        setError('Fehler beim Laden der Daten')
      } finally {
        setLoading(false)
      }
    }
    fetchRepairerDetails()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Profil...</p>
        </div>
      </div>
    )
  }

  if (error || !repairer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Reparateur nicht gefunden'}
          </h2>
          <Link href="/repairers" className="text-blue-600 hover:text-blue-700 font-medium">
            Zurück zur Suche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/repairers"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Suche
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {repairer.business_name || 'Reparateur'}
                  </h1>
                  {repairer.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verifiziert
                    </span>
                  )}
                </div>

                <p className="text-gray-600 capitalize mb-2">{repairer.business_type}</p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <StarRating rating={repairer.average_rating} />
                    <span className="ml-1 font-medium">
                      {(repairer.average_rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      ({repairer.total_reviews} Bewertungen)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {repairer.postal_code} {repairer.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {repairer.years_experience} Jahre Erfahrung
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/repairers/${repairer.id}/book`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Termin buchen
              </Link>
              <a
                href={`tel:${repairer.phone}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Anrufen
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {repairer.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Über uns</h2>
                <p className="text-gray-600 whitespace-pre-line">{repairer.description}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b">
                {(['services', 'reviews', 'about'] as const).map((tab) => {
                  const labels = {
                    services: `Angebotene Services (${services.length})`,
                    reviews: `Bewertungen (${repairer.total_reviews})`,
                    about: 'Details',
                  }
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  )
                })}
              </div>

              <div className="p-6">
                {activeTab === 'services' && (
                  <ServicesTab
                    services={services}
                    servicesOffered={repairer.services_offered}
                  />
                )}
                {activeTab === 'reviews' && (
                  <ReviewsTab
                    reviews={reviews}
                    averageRating={repairer.average_rating}
                    totalReviews={repairer.total_reviews}
                    ratingDistribution={repairer.rating_distribution}
                  />
                )}
                {activeTab === 'about' && <AboutTab repairer={repairer} />}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <RepairerSidebar repairer={repairer} availability={availability} />
        </div>
      </div>
    </div>
  )
}
