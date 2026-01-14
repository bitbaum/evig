'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Wrench,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  Shield,
  Award,
  ChevronRight,
  MessageCircle
} from 'lucide-react'

interface RepairerProfile {
  id: string
  user_id: string
  business_name: string | null
  business_type: string
  description: string | null
  years_experience: number
  phone: string
  website: string | null
  address: string
  city: string
  postal_code: string
  service_radius_km: number
  remote_services: boolean
  hourly_rate_cents: number | null
  emergency_fee_cents: number | null
  home_visit_fee_cents: number | null
  average_rating: number
  total_reviews: number
  total_jobs_completed: number
  completion_rate: number
  services_offered: string[]
  specializations: string[]
  certifications: string[]
  is_verified: boolean
  response_time_hours: number
  typical_turnaround_days: number
  warranty_offered: boolean
  warranty_duration_months: number | null
  insurance_info: string | null
  portfolio_images: string[]
  rating_distribution: { [key: string]: number }
  review_summary: {
    timeliness: number
    quality: number
    communication: number
    professionalism: number
    value: number
  }
}

interface Service {
  id: string
  service_category: string
  service_name: string
  description: string | null
  base_price_cents: number | null
  hourly_rate_cents: number | null
  parts_included: boolean
  estimated_hours: number | null
  estimated_days: number | null
}

interface Review {
  id: string
  reviewerName: string
  rating: number
  title: string | null
  content: string | null
  timeliness_rating: number | null
  quality_rating: number | null
  communication_rating: number | null
  isVerifiedPurchase: boolean
  createdAt: string
  response: {
    content: string
    responderName: string
    createdAt: string
  } | null
}

interface AvailabilitySlot {
  date: string
  start_time: string
  end_time: string
}

export default function RepairerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [repairer, setRepairer] = useState<RepairerProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services')

  useEffect(() => {
    fetchRepairerDetails()
  }, [id])

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

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'laptop_repair': return '💻'
      case 'phone_repair': return '📱'
      case 'tablet_repair': return '📱'
      case 'desktop_repair': return '🖥️'
      case 'console_repair': return '🎮'
      case 'audio_repair': return '🔊'
      default: return '🔧'
    }
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Auf Anfrage'
    return `CHF ${(cents / 100).toFixed(0)}`
  }

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
          <Link
            href="/repairers"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
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
                    {renderStars(repairer.average_rating)}
                    <span className="ml-1 font-medium">{repairer.average_rating.toFixed(1)}</span>
                    <span className="text-gray-500">({repairer.total_reviews} Bewertungen)</span>
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
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'services'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Angebotene Services ({services.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bewertungen ({repairer.total_reviews})
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'about'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
              </div>

              <div className="p-6">
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {services.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Keine spezifischen Services hinterlegt.</p>
                        <p className="text-sm mt-2">
                          Kontaktieren Sie den Reparateur für ein individuelles Angebot.
                        </p>
                      </div>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{getServiceIcon(service.service_category)}</span>
                              <div>
                                <h3 className="font-medium text-gray-900">{service.service_name}</h3>
                                <p className="text-sm text-gray-500 capitalize">
                                  {service.service_category.replace('_', ' ')}
                                </p>
                                {service.description && (
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  {service.estimated_hours && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      ca. {service.estimated_hours}h
                                    </span>
                                  )}
                                  {service.parts_included && (
                                    <span className="text-green-600">Teile inkl.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(service.base_price_cents)}
                              </p>
                              {service.hourly_rate_cents && (
                                <p className="text-xs text-gray-500">
                                  oder {formatPrice(service.hourly_rate_cents)}/Std
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* General service categories */}
                    {repairer.services_offered.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Allgemeine Servicebereiche</h4>
                        <div className="flex flex-wrap gap-2">
                          {repairer.services_offered.map((service) => (
                            <span
                              key={service}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                              {getServiceIcon(service)}
                              <span className="ml-1 capitalize">{service.replace('_', ' ')}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    {/* Rating Summary */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{repairer.average_rating.toFixed(1)}</div>
                        <div className="mt-1">{renderStars(repairer.average_rating, 'lg')}</div>
                        <div className="text-sm text-gray-500 mt-1">{repairer.total_reviews} Bewertungen</div>
                      </div>

                      {repairer.rating_distribution && Object.keys(repairer.rating_distribution).length > 0 && (
                        <div className="flex-1 space-y-1">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = repairer.rating_distribution[stars.toString()] || 0
                            const percentage = repairer.total_reviews > 0
                              ? (count / repairer.total_reviews) * 100
                              : 0

                            return (
                              <div key={stars} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-gray-600">{stars}</span>
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-gray-600">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Reviews List */}
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Noch keine Bewertungen vorhanden.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{review.reviewerName}</span>
                                  {review.isVerifiedPurchase && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Verifiziert
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {renderStars(review.rating, 'sm')}
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString('de-CH')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {review.title && (
                              <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                            )}

                            {review.content && (
                              <p className="text-gray-700 text-sm">{review.content}</p>
                            )}

                            {/* Sub-ratings */}
                            {(review.timeliness_rating || review.quality_rating || review.communication_rating) && (
                              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                {review.timeliness_rating && (
                                  <span>Pünktlichkeit: {review.timeliness_rating}/5</span>
                                )}
                                {review.quality_rating && (
                                  <span>Qualität: {review.quality_rating}/5</span>
                                )}
                                {review.communication_rating && (
                                  <span>Kommunikation: {review.communication_rating}/5</span>
                                )}
                              </div>
                            )}

                            {/* Repairer Response */}
                            {review.response && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-blue-900">
                                    Antwort von {review.response.responderName}
                                  </span>
                                </div>
                                <p className="text-blue-800 text-sm">{review.response.content}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    {/* Specializations */}
                    {repairer.specializations && repairer.specializations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Spezialisierungen</h4>
                        <div className="flex flex-wrap gap-2">
                          {repairer.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 capitalize"
                            >
                              {spec.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {repairer.certifications && repairer.certifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Zertifizierungen</h4>
                        <div className="flex flex-wrap gap-2">
                          {repairer.certifications.map((cert) => (
                            <span
                              key={cert}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                            >
                              <Award className="w-3 h-3 mr-1" />
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{repairer.total_jobs_completed}</div>
                        <div className="text-sm text-gray-600">Aufträge erledigt</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{repairer.completion_rate}%</div>
                        <div className="text-sm text-gray-600">Abschlussrate</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{repairer.response_time_hours}h</div>
                        <div className="text-sm text-gray-600">Antwortzeit</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-900">{repairer.typical_turnaround_days} Tage</div>
                        <div className="text-sm text-gray-600">Typische Dauer</div>
                      </div>
                    </div>

                    {/* Warranty & Insurance */}
                    <div className="space-y-3">
                      {repairer.warranty_offered && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">
                            Garantie: {repairer.warranty_duration_months} Monate
                          </span>
                        </div>
                      )}
                      {repairer.insurance_info && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">Versichert: {repairer.insurance_info}</span>
                        </div>
                      )}
                      {repairer.remote_services && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Bietet Remote-Support an</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Kontakt</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-gray-900">{repairer.address}</div>
                    <div className="text-gray-600">{repairer.postal_code} {repairer.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${repairer.phone}`} className="text-blue-600 hover:underline">
                    {repairer.phone}
                  </a>
                </div>
                {repairer.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={repairer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website besuchen
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Serviceradius:</span> {repairer.service_radius_km} km
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Preise</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stundensatz</span>
                  <span className="font-medium">{formatPrice(repairer.hourly_rate_cents)}</span>
                </div>
                {repairer.home_visit_fee_cents && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hausbesuch</span>
                    <span className="font-medium">+{formatPrice(repairer.home_visit_fee_cents)}</span>
                  </div>
                )}
                {repairer.emergency_fee_cents && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notfall-Zuschlag</span>
                    <span className="font-medium">+{formatPrice(repairer.emergency_fee_cents)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Preview */}
            {availability.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Nächste Verfügbarkeit</h3>
                <div className="space-y-2">
                  {availability.slice(0, 5).map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 bg-green-50 rounded"
                    >
                      <span className="text-gray-700">
                        {new Date(slot.date).toLocaleDateString('de-CH', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-green-700">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/repairers/${repairer.id}/book`}
                  className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Termin buchen
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Reparatur anfragen</h3>
              <p className="text-blue-100 text-sm mb-4">
                Beschreiben Sie Ihr Problem und erhalten Sie ein unverbindliches Angebot.
              </p>
              <Link
                href={`/repairers/${repairer.id}/book`}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Jetzt anfragen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
