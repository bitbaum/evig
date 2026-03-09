'use client'

import { Search, Filter } from 'lucide-react'
import { SERVICE_CATEGORIES } from './helpers'

interface RepairerSearchBarProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedService: string
  setSelectedService: (v: string) => void
  userLocation: string
  setUserLocation: (v: string) => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  onSearch: () => void
}

export function RepairerSearchBar({
  searchQuery,
  setSearchQuery,
  selectedService,
  setSelectedService,
  userLocation,
  setUserLocation,
  showFilters,
  setShowFilters,
  onSearch,
}: RepairerSearchBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Reparateur suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Service Filter */}
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
        >
          <option value="">Alle Services</option>
          {SERVICE_CATEGORIES.map((option) => (
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
          onClick={onSearch}
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
  )
}
