'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { Wrench } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { type RepairerProfile, type RepairerReview } from '@/components/repairers/types'
import { RepairerSearchBar } from '@/components/repairers/RepairerSearchBar'
import { RepairerCard } from '@/components/repairers/RepairerCard'
import { RepairerReviewsModal } from '@/components/repairers/RepairerReviewsModal'
import Heading from '@/components/ui/Heading'

interface RepairerFilters {
  q?: string
  service?: string
  location?: string
}

// API response review format (different field names from shared type)
interface ApiReviewResponse {
  id: string
  reviewerName: string
  overallRating: number
  title?: string
  content: string
  createdAt: string
  isVerifiedPurchase: boolean
  response?: {
    content: string
    responderName: string
    createdAt: string
  }
}

export default function RepairersPage() {
  const [repairers, setRepairers] = useState<RepairerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [userLocation, setUserLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRepairer, setSelectedRepairer] = useState<RepairerProfile | null>(null)
  const [repairerReviews, setRepairerReviews] = useState<RepairerReview[]>([])
  const [showReviewsModal, setShowReviewsModal] = useState(false)

  const fetchRepairers = useCallback(async (filters: RepairerFilters = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.q) params.set('q', filters.q)
      if (filters.service) params.set('service', filters.service)
      if (filters.location) params.set('location', filters.location)

      const result = await apiFetch<{ repairers: any[] }>(`/api/repairers?${params}`)

      if (result.success) {
        // Normalize API response (camelCase from Drizzle) to snake_case expected by components
        const normalized = (result.data?.repairers || []).map((r: any) => ({
          ...r,
          // Map camelCase → snake_case for fields used by RepairerCard
          business_name: r.business_name ?? r.businessName ?? null,
          business_type: r.business_type ?? r.businessType ?? 'individual',
          user_id: r.user_id ?? r.userId,
          postal_code: r.postal_code ?? r.postalCode ?? '',
          service_radius_km: r.service_radius_km ?? r.serviceRadiusKm,
          remote_services: r.remote_services ?? r.remoteServices,
          hourly_rate_cents: r.hourly_rate_cents ?? r.hourlyRateCents ?? null,
          emergency_fee_cents: r.emergency_fee_cents ?? r.emergencyFeeCents ?? null,
          home_visit_fee_cents: r.home_visit_fee_cents ?? r.homeVisitFeeCents ?? null,
          total_reviews: r.total_reviews ?? r.totalReviews ?? 0,
          total_jobs_completed: r.total_jobs_completed ?? r.totalJobsCompleted ?? 0,
          services_offered: r.services_offered ?? r.servicesOffered ?? [],
          is_verified: r.is_verified ?? r.isVerified ?? false,
          response_time_hours: r.response_time_hours ?? r.responseTimeHours,
          typical_turnaround_days: r.typical_turnaround_days ?? r.typicalTurnaroundDays,
          warranty_offered: r.warranty_offered ?? r.warrantyOffered ?? false,
          warranty_duration_months: r.warranty_duration_months ?? r.warrantyDurationMonths ?? null,
          distance_km: r.distance_km ?? r.distanceKm ?? null,
          rating_distribution: r.rating_distribution ?? r.ratingDistribution ?? {},
          review_summary: r.review_summary ?? r.reviewSummary ?? {},
          average_rating: parseFloat(String(r.average_rating ?? r.averageRating ?? 0)) || 0,
        })) as RepairerProfile[]
        setRepairers(normalized)
      }
    } catch (error) {
      logger.error('Error fetching repairers', { error })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepairers({})
  }, [fetchRepairers])

  const handleSearch = () => {
    fetchRepairers({ q: searchQuery, service: selectedService, location: userLocation })
  }

  const handleViewReviews = async (repairer: RepairerProfile) => {
    setSelectedRepairer(repairer)
    try {
      const result = await apiFetch<{ reviews: ApiReviewResponse[] }>(
        `/api/reviews?targetType=repairer&targetId=${repairer.id}&limit=5`
      )
      if (result.success) {
        const reviews = result.data?.reviews || []
        setRepairerReviews(
          reviews.map((review: ApiReviewResponse) => ({
            id: review.id,
            reviewerName: review.reviewerName,
            rating: review.overallRating,
            title: review.title ?? null,
            content: review.content,
            createdAt: review.createdAt,
            isVerifiedPurchase: review.isVerifiedPurchase,
            response: review.response ?? null,
            timeliness_rating: null,
            quality_rating: null,
            communication_rating: null,
          }))
        )
      }
    } catch (error) {
      logger.error('Error fetching reviews', { error })
      setRepairerReviews([])
    }
    setShowReviewsModal(true)
  }

  const handleResetSearch = () => {
    setSearchQuery('')
    setSelectedService('')
    setUserLocation('')
    fetchRepairers()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        theme="repairers"
        icon={Wrench}
        title="Reparateure finden"
        subtitle="Finde zertifizierte Reparateure in deiner Nähe für alle Arten von Elektronik-Reparaturen."
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <RepairerSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onSearch={handleSearch}
        />

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Suche nach Reparateuren...</p>
          </div>
        ) : repairers.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <Heading level={3} className="text-xl text-gray-900 mb-2">
              Keine Reparateure gefunden
            </Heading>
            <p className="text-gray-600 mb-6">
              Versuche andere Suchkriterien oder erweitere deinen Suchradius.
            </p>
            <button
              onClick={handleResetSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Alle anzeigen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repairers.map((repairer) => (
              <RepairerCard
                key={repairer.id}
                repairer={repairer}
                onViewReviews={handleViewReviews}
              />
            ))}
          </div>
        )}

        {/* Become a Repairer CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4" />
          <Heading level={2} className="text-2xl mb-4">
            Bist du ein Reparaturexperte?
          </Heading>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Tritt unserer Plattform bei und verbinde dich mit Kunden,
            die deine Fachkenntnisse brauchen. Verdiene Geld mit deinen Fähigkeiten.
          </p>
          <Link
            href="/dashboard/repairer/onboarding"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Als Reparateur bewerben
          </Link>
        </div>
      </div>

      {/* Reviews Modal */}
      {showReviewsModal && selectedRepairer && (
        <RepairerReviewsModal
          repairer={selectedRepairer}
          reviews={repairerReviews}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </div>
  )
}
