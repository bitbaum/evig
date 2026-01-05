'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Search,
  MapPin,
  Star,
  Clock,
  Wrench,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle
} from 'lucide-react'

interface Repairer {
  id: string
  user_id: string
  business_name: string | null
  business_type: string
  description: string
  phone: string
  address: string
  city: string
  postal_code: string
  service_radius_km: number
  remote_services: boolean
  hourly_rate_cents: number | null
  average_rating: number
  total_reviews: number
  services_offered: string[]
  specializations: string[]
  is_verified: boolean
  distance_km?: number
}

export default function RepairersPage() {
  const [repairers, setRepairers] = useState<Repairer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [userLocation, setUserLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchRepairers()
  }, [])

  interface RepairerFilters {
    q?: string
    service?: string
    location?: string
  }

  const fetchRepairers = async (filters: RepairerFilters = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (searchQuery) params.set('q', searchQuery)
      if (selectedService) params.set('service', selectedService)
      if (userLocation) params.set('location', userLocation)

      const response = await fetch(`/api/repairers?${params}`)
      const data = await response.json()

      if (data.success) {
        setRepairers(data.repairers)
      }
    } catch (error) {
      logger.error('Error fetching repairers', { error })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRepairers({ q: searchQuery, service: selectedService, location: userLocation })
  }

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'laptop_repair': return '💻'
      case 'phone_repair': return '📱'
      case 'tablet_repair': return '📱'
      case 'desktop_repair': return '🖥️'
      case 'console_repair': return '🎮'
      case 'audio_repair': return '🔊'
      default: return '🔧'
    }
  }

  const serviceOptions = [
    { value: '', label: 'Alle Services' },
    { value: 'laptop_repair', label: 'Laptop-Reparatur' },
    { value: 'phone_repair', label: 'Smartphone-Reparatur' },
    { value: 'tablet_repair', label: 'Tablet-Reparatur' },
    { value: 'desktop_repair', label: 'Desktop-PC Reparatur' },
    { value: 'console_repair', label: 'Spielkonsole Reparatur' },
    { value: 'audio_repair', label: 'Audio-Geräte Reparatur' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reparateure finden
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Finden Sie zertifizierte Reparateure in Ihrer Nähe für alle Arten von Elektronik-Reparaturen.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Reparateur suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Service Filter */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              {serviceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Location Input */}
            <input
              type="text"
              placeholder="PLZ oder Ort..."
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            />

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Suchen
            </button>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mindestbewertung
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Alle Bewertungen</option>
                    <option value="4.5">4.5+ Sterne</option>
                    <option value="4.0">4.0+ Sterne</option>
                    <option value="3.5">3.5+ Sterne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximale Entfernung
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Alle Entfernungen</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verfügbarkeit
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Alle Zeiten</option>
                    <option value="today">Heute verfügbar</option>
                    <option value="weekend">Wochenenden</option>
                    <option value="evening">Abends</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Suche nach Reparateuren...</p>
          </div>
        ) : repairers.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Reparateure gefunden
            </h3>
            <p className="text-gray-600 mb-6">
              Versuchen Sie andere Suchkriterien oder erweitern Sie Ihren Suchradius.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedService('')
                setUserLocation('')
                fetchRepairers()
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Alle anzeigen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repairers.map((repairer) => (
              <div key={repairer.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {repairer.business_name || 'Unbenannter Reparateur'}
                        </h3>
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
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.floor(repairer.average_rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {repairer.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({repairer.total_reviews} Bewertungen)
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {repairer.description}
                  </p>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {repairer.services_offered.slice(0, 3).map((service) => (
                      <span key={service} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
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
                    <span>{repairer.postal_code} {repairer.city}</span>
                    {repairer.distance_km && (
                      <span className="ml-2 text-blue-600">
                        ({repairer.distance_km.toFixed(1)} km entfernt)
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      {repairer.hourly_rate_cents
                        ? `CHF ${(repairer.hourly_rate_cents / 100).toFixed(0)}/Std`
                        : 'Preis auf Anfrage'
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {repairer.service_radius_km} km Radius
                    </div>
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
            ))}
          </div>
        )}

        {/* Become a Repairer CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Sind Sie ein Reparaturexperte?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Treten Sie unserer Plattform bei und verbinden Sie sich mit Kunden,
            die Ihre Fachkenntnisse brauchen. Verdienen Sie Geld mit Ihren Fähigkeiten.
          </p>
          <Link
            href="/dashboard/repairer/onboarding"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Als Reparateur bewerben
          </Link>
        </div>
      </div>
    </div>
  )
}