'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateShort } from '@/lib/date-formats'
import { LOCATION_STATUS, getLocationStatusLabel } from '@/config/location-status'
import { apiFetch } from '@/lib/api/client'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import type { StatusConfig } from '@/components/admin/AdminStatusBadge'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'
import {
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Users,
  Building2,
  Loader2,
} from 'lucide-react'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

interface Location {
  id: string
  name: string
  type: string
  city: string
  canton: string
  approvalStatus: string
  maxCapacity: number | null
  usageCount: number
  createdAt: string
  createdBy: string
}

const PAGE_SIZE = 20

const LOCATION_STATUS_CONFIG: Record<string, StatusConfig> = {
  [LOCATION_STATUS.APPROVED]: { label: getLocationStatusLabel(LOCATION_STATUS.APPROVED), color: 'bg-primary-100 text-primary-800' },
  [LOCATION_STATUS.PENDING]: { label: getLocationStatusLabel(LOCATION_STATUS.PENDING), color: 'bg-yellow-100 text-yellow-800' },
  [LOCATION_STATUS.REJECTED]: { label: getLocationStatusLabel(LOCATION_STATUS.REJECTED), color: 'bg-error-100 text-error-800' },
  [LOCATION_STATUS.SUSPENDED]: { label: getLocationStatusLabel(LOCATION_STATUS.SUSPENDED), color: 'bg-orange-100 text-orange-800' },
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'venue':
      return <Building2 className="w-4 h-4" />
    case 'online':
      return <Eye className="w-4 h-4" />
    default:
      return <MapPin className="w-4 h-4" />
  }
}

export default function AdminLocationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [totalItems, setTotalItems] = useState(0)

  const [searchName, setSearchName] = useState('')
  const [filters, setFilters] = useState({ status: 'all', type: 'all', city: '' })
  const [currentPage, setCurrentPage] = useState(1)

  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: 'approve' | 'reject'; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false

    async function load() {
      setLoading(true)
      const params = new URLSearchParams({
        status: filters.status,
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      })
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.city) params.set('city', filters.city)

      const result = await apiFetch<{ locations: Location[]; pagination?: { total: number } }>(
        `/api/locations?${params}`
      )
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setLocations(result.data.locations ?? [])
        setTotalItems(result.data.pagination?.total ?? 0)
      } else {
        setError(result.error || ADMIN_CONTENT.locations.errorMessage)
      }
    }

    load()
    return () => { cancelled = true }
  }, [status, filters.status, filters.type, filters.city, currentPage])

  const doApproval = async () => {
    if (!confirmTarget) return
    setActionLoading(true)
    const result = await apiFetch<void>(`/api/locations/${confirmTarget.id}/approve`, {
      method: 'POST',
      body: {
        action: confirmTarget.action,
        review_notes: confirmTarget.action === 'reject' ? 'Administrative Prüfung' : 'Ort genehmigt',
      },
    })
    setActionLoading(false)
    if (result.success) {
      setConfirmTarget(null)
      setFilters(prev => ({ ...prev }))
    } else {
      setError(result.error || 'Fehler bei der Genehmigung')
      setConfirmTarget(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  const filteredLocations = searchName.trim()
    ? locations.filter(
        l =>
          l.name.toLowerCase().includes(searchName.toLowerCase()) ||
          l.city.toLowerCase().includes(searchName.toLowerCase())
      )
    : locations

  return (
    <AdminPageWrapper
      title="Ortsverwaltung"
      description="Veranstaltungsorte und deren Genehmigungen verwalten"
      icon={MapPin}
      iconColor="blue"
      actions={
        <Link
          href="/admin/locations/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Ort
        </Link>
      }
    >
      {/* Filters */}
      <AdminFilterBar
        searchValue={searchName}
        onSearchChange={setSearchName}
        searchPlaceholder="Name suchen..."
        dropdowns={[
          {
            key: 'status',
            label: 'Status',
            value: filters.status,
            onChange: (value) => setFilters(prev => ({ ...prev, status: value })),
            options: [
              { value: LOCATION_STATUS.PENDING, label: getLocationStatusLabel(LOCATION_STATUS.PENDING) },
              { value: LOCATION_STATUS.APPROVED, label: getLocationStatusLabel(LOCATION_STATUS.APPROVED) },
              { value: LOCATION_STATUS.REJECTED, label: getLocationStatusLabel(LOCATION_STATUS.REJECTED) },
              { value: LOCATION_STATUS.SUSPENDED, label: getLocationStatusLabel(LOCATION_STATUS.SUSPENDED) },
            ],
          },
          {
            key: 'type',
            label: 'Typ',
            value: filters.type,
            onChange: (value) => setFilters(prev => ({ ...prev, type: value })),
            options: [
              { value: 'venue', label: 'Veranstaltungsort' },
              { value: 'home', label: 'Zu Hause' },
              { value: 'online', label: 'Online' },
              { value: 'community_center', label: 'Gemeinschaftszentrum' },
              { value: 'business', label: 'Geschäft' },
            ],
          },
        ]}
      >
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Stadt</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Stadt suchen..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500"
          />
        </div>
      </AdminFilterBar>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-error-800">{error}</p>
        </div>
      )}

      {/* Locations List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Heading level={2} className="text-lg font-semibold text-neutral-900">
            Orte ({filteredLocations.length})
          </Heading>
        </div>

        <div className="divide-y divide-neutral-200">
          {filteredLocations.map((location) => (
            <div key={location.id} className="p-6 hover:bg-neutral-50">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(location.type)}
                    <Heading level={3} className="text-lg font-semibold text-neutral-900 truncate">
                      {location.name}
                    </Heading>
                    <AdminStatusBadge
                      status={location.approvalStatus}
                      config={LOCATION_STATUS_CONFIG}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {location.city}, {location.canton}
                    </div>

                    {location.maxCapacity && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Max. {location.maxCapacity} Personen
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {location.usageCount} Buchungen
                    </div>
                  </div>

                  <div className="text-sm text-neutral-500">
                    {location.createdAt && formatDateShort(location.createdAt)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                  <Link
                    href={`/admin/locations/${location.id}`}
                    className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Link>

                  {location.approvalStatus === LOCATION_STATUS.PENDING && (
                    <>
                      <button
                        onClick={() => setConfirmTarget({ id: location.id, action: 'approve', name: location.name })}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Genehmigen
                      </button>
                      <button
                        onClick={() => setConfirmTarget({ id: location.id, action: 'reject', name: location.name })}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 bg-error-600 text-white rounded-lg text-sm font-medium hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Ablehnen
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredLocations.length === 0 && (
            <div className="px-6 py-12 text-center">
              <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">
                {ADMIN_CONTENT.locations.emptyTitle}
              </Heading>
              <p className="text-neutral-600 mb-4">
                {searchName.trim()
                  ? `Keine Orte für "${searchName}" gefunden.`
                  : filters.status !== 'all'
                  ? `Keine Orte mit Status "${getLocationStatusLabel(filters.status)}" gefunden.`
                  : ADMIN_CONTENT.locations.emptyDescription}
              </p>
              <Link
                href="/admin/locations/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ersten Ort erstellen
              </Link>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={confirmTarget?.action === 'approve' ? 'Ort genehmigen' : 'Ort ablehnen'}
        message={
          confirmTarget?.action === 'approve'
            ? 'Möchtest du diesen Ort wirklich genehmigen?'
            : 'Möchtest du diesen Ort wirklich ablehnen?'
        }
        itemName={confirmTarget?.name}
        confirmLabel={confirmTarget?.action === 'approve' ? 'Genehmigen' : 'Ablehnen'}
        cancelLabel="Abbrechen"
        variant={confirmTarget?.action === 'approve' ? 'success' : 'danger'}
        isLoading={actionLoading}
        onConfirm={doApproval}
        onClose={() => setConfirmTarget(null)}
      />
    </AdminPageWrapper>
  )
}
