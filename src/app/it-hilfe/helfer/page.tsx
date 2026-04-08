'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  Search,
  Filter,
  ChevronDown,
  Users,
  Sparkles,
} from 'lucide-react'
import {
  IT_HILFE,
  SERVICE_CATEGORIES,
  SWISS_CANTONS,
  SERVICE_TYPES,
  IT_SKILLS,
} from '@/config/it-hilfe'
import { HelperCard } from '@/components/it-hilfe/HelperCard'
import Heading from '@/components/ui/Heading'

interface Helper {
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  postalCode: string | null
  city: string | null
  canton: string | null
  maxTravelKm: number
  skills: string[]
}

export default function HelferPage() {
  const HELPERS_PER_PAGE = 20
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [canton, setCanton] = useState('')
  const [acceptsGratis, setAcceptsGratis] = useState(false)
  const [acceptsKulturlegi, setAcceptsKulturlegi] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const fetchHelpers = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      const params = new URLSearchParams()

      if (selectedSkills.length > 0) {
        params.set('skills', selectedSkills.join(','))
      }
      if (canton) params.set('canton', canton)
      if (acceptsGratis) params.set('acceptsGratis', 'true')
      if (acceptsKulturlegi) params.set('acceptsKulturlegi', 'true')
      if (serviceType) params.set('serviceType', serviceType)
      params.set('limit', String(HELPERS_PER_PAGE))
      params.set('offset', String((pageNum - 1) * HELPERS_PER_PAGE))

      const response = await fetch(`${IT_HILFE.api.helpers}?${params}`)
      const data = await response.json()

      if (data.success) {
        setHelpers(prev => append ? [...prev, ...data.data.helpers] : data.data.helpers)
        setTotal(data.data.total)
        setHasMore(data.data.pagination?.hasMore ?? false)
      }
    } catch (error) {
      logger.error('Error fetching helpers', { error })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedSkills, canton, acceptsGratis, acceptsKulturlegi, serviceType])

  useEffect(() => {
    setPage(1)
    fetchHelpers(1)
  }, [fetchHelpers])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchHelpers(nextPage, true)
  }

  const clearFilters = () => {
    setSelectedSkills([])
    setCanton('')
    setAcceptsGratis(false)
    setAcceptsKulturlegi(false)
    setServiceType('')
  }

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const hasActiveFilters = selectedSkills.length > 0 || canton || acceptsGratis || acceptsKulturlegi || serviceType

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <Heading level={1} className="text-3xl">IT-Techniker finden</Heading>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl mb-8">
            Finde erfahrene IT-Techniker in deiner Nähe. Von Reparaturen bis Beratung - unsere Community hilft dir weiter.
          </p>

          <Link
            href={IT_HILFE.routes.browse}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Zurück zu Anfragen
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Filter zurücksetzen
              </button>
            )}

            <div className="ml-auto text-sm text-gray-500">
              {total} {total === 1 ? 'Techniker' : 'Techniker'} gefunden
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Skills Filter (grouped by category) */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fähigkeiten
                  </label>
                  <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {SERVICE_CATEGORIES.map((category) => {
                      const categorySkills = IT_SKILLS[category.id] || []
                      const CategoryIcon = category.icon

                      return (
                        <div key={category.id}>
                          <button
                            onClick={() => setExpandedCategory(
                              expandedCategory === category.id ? null : category.id
                            )}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4" />
                              {category.name}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedCategory === category.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedCategory === category.id && categorySkills.length > 0 && (
                            <div className="ml-6 mt-1 space-y-1">
                              {categorySkills.map(skill => (
                                <label
                                  key={skill.id}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.includes(skill.id)}
                                    onChange={() => toggleSkill(skill.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-600">{skill.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  {/* Canton filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kanton
                    </label>
                    <select
                      value={canton}
                      onChange={(e) => setCanton(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Alle Kantone</option>
                      {SWISS_CANTONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Service Type filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service-Art
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Alle</option>
                      {SERVICE_TYPES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preisoptionen
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptsGratis}
                          onChange={(e) => setAcceptsGratis(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Akzeptiert Gratis-Anfragen
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptsKulturlegi}
                          onChange={(e) => setAcceptsKulturlegi(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          Akzeptiert KulturLegi
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Helpers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : helpers.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <Heading level={3} className="text-xl text-gray-900 mb-2">
              Keine Techniker gefunden
            </Heading>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Versuche andere Filter oder setze sie zurück.'
                : 'Derzeit sind keine Techniker verfügbar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpers.map((helper) => (
              <HelperCard key={helper.userId} helper={helper} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Wird geladen...' : 'Mehr laden'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
