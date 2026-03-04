'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateShort } from '@/lib/date-formats'
import { getApprovalStatusLabel } from '@/config/approval-status'
import {
  MapPin,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Users,
  Building2
} from 'lucide-react'

interface Location {
  id: string
  name: string
  type: string
  city: string
  canton: string
  approval_status: string
  max_capacity: number | null
  usage_count: number
  active_bookings: number
  created_at: string
  creator_name: string
  creator_email: string
}

export default function AdminLocationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    city: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filters.status === 'all' ? 'approved' : filters.status,
        limit: '20',
        offset: ((currentPage - 1) * 20).toString()
      })

      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.city) params.set('city', filters.city)

      const response = await fetch(`/api/locations?${params}`)
      if (response.ok) {
        const json = await response.json()
        const payload = json.data ?? json
        setLocations(payload.locations ?? [])
        setTotalPages(Math.ceil((payload.pagination?.total ?? 0) / 20))
      } else {
        setError('Fehler beim Laden der Orte')
      }
    } catch (error) {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.type, filters.city, currentPage])

  useEffect(() => {
    if (status === 'authenticated') {
      loadLocations()
    }
  }, [status, loadLocations])

  const handleApproval = async (locationId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Möchten Sie diesen Ort wirklich ${action === 'approve' ? 'genehmigen' : 'ablehnen'}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${locationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          review_notes: action === 'reject' ? 'Administrative Prüfung' : 'Ort genehmigt'
        })
      })

      if (response.ok) {
        loadLocations() // Reload the list
      } else {
        alert('Fehler bei der Genehmigung')
      }
    } catch (error) {
      alert('Netzwerkfehler')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'suspended':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    if (status === 'suspended') return 'Suspendiert'
    return getApprovalStatusLabel(status)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'venue':
        return <Building2 className="w-4 h-4" />
      case 'home':
        return <MapPin className="w-4 h-4" />
      case 'online':
        return <Eye className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ortsverwaltung</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie Veranstaltungsorte und deren Genehmigungen
              </p>
            </div>
            <Link
              href="/admin/locations/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neuer Ort
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle</option>
                <option value="pending">Ausstehend</option>
                <option value="approved">Genehmigt</option>
                <option value="rejected">Abgelehnt</option>
                <option value="suspended">Suspendiert</option>
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle</option>
                <option value="venue">Veranstaltungsort</option>
                <option value="home">Zu Hause</option>
                <option value="online">Online</option>
                <option value="community_center">Gemeinschaftszentrum</option>
                <option value="business">Geschäft</option>
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Stadt suchen..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Locations List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Orte ({locations.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {locations.map((location) => (
              <div key={location.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(location.type)}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {location.name}
                      </h3>
                      {getStatusIcon(location.approval_status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(location.approval_status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {location.city}, {location.canton}
                      </div>

                      {location.max_capacity && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max. {location.max_capacity} Personen
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {location.usage_count} Buchungen
                      </div>

                      {location.active_bookings > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {location.active_bookings} aktiv
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      Erstellt von {location.creator_name} ({location.creator_email}) • {formatDateShort(location.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/locations/${location.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Link>

                    {location.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproval(location.id, 'approve')}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Genehmigen
                        </button>
                        <button
                          onClick={() => handleApproval(location.id, 'reject')}
                          className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ablehnen
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {locations.length === 0 && !loading && (
              <div className="px-6 py-12 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Orte gefunden</h3>
                <p className="text-gray-600 mb-4">
                  {filters.status === 'all' ? 'Es wurden noch keine Orte erstellt.' : `Keine Orte mit Status "${filters.status}" gefunden.`}
                </p>
                <Link
                  href="/admin/locations/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ersten Ort erstellen
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Zurück
              </button>

              <span className="px-4 py-2 text-sm text-gray-700">
                Seite {currentPage} von {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Weiter →
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}