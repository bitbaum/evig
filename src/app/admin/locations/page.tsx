'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/date-formats'
import { LOCATION_STATUS, LOCATION_STATUS_CONFIG } from '@/config/location-status'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
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
import { Input } from '@/components/ui/input'
import { useAdminLocations } from '@/hooks/useAdminLocations'
import { ROUTES } from '@/config/routes'

function getTypeIcon(type: string) {
  switch (type) {
    case 'venue': return <Building2 className="w-4 h-4" />
    case 'online': return <Eye className="w-4 h-4" />
    default: return <MapPin className="w-4 h-4" />
  }
}

export default function AdminLocationsPage() {
  const {
    sessionStatus,
    filteredLocations,
    loading,
    error,
    totalItems,
    totalPages,
    searchName,
    filters,
    currentPage,
    confirmTarget,
    actionLoading,
    pageSize,
    setSearchName,
    setFilters,
    setCurrentPage,
    setConfirmTarget,
    doApproval,
  } = useAdminLocations()

  if (sessionStatus === 'loading' || loading) {
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

  return (
    <AdminPageWrapper
      title="Ortsverwaltung"
      description="Veranstaltungsorte und deren Genehmigungen verwalten"
      icon={MapPin}
      iconColor="blue"
      actions={
        <Button as={Link} href={ROUTES.admin.locationNew} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          Neuer Ort
        </Button>
      }
    >
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
              { value: LOCATION_STATUS.PENDING, label: LOCATION_STATUS_CONFIG[LOCATION_STATUS.PENDING].label },
              { value: LOCATION_STATUS.APPROVED, label: LOCATION_STATUS_CONFIG[LOCATION_STATUS.APPROVED].label },
              { value: LOCATION_STATUS.REJECTED, label: LOCATION_STATUS_CONFIG[LOCATION_STATUS.REJECTED].label },
              { value: LOCATION_STATUS.SUSPENDED, label: LOCATION_STATUS_CONFIG[LOCATION_STATUS.SUSPENDED].label },
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
          <label className="block text-sm font-medium text-text-secondary mb-1">Stadt</label>
          <Input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Stadt suchen..."
          />
        </div>
      </AdminFilterBar>

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <p className="text-error-800 dark:text-error-400">{error}</p>
        </div>
      )}

      <div className="bg-surface-base rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border">
          <Heading level={2} className="text-lg font-semibold text-text-primary">
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
                    <Heading level={3} className="text-lg font-semibold text-text-primary truncate">
                      {location.name}
                    </Heading>
                    <AdminStatusBadge status={location.approvalStatus} config={LOCATION_STATUS_CONFIG} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-3">
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

                  <div className="text-sm text-text-tertiary">
                    {location.createdAt && formatDateShort(location.createdAt)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                  <Link
                    href={ROUTES.admin.location(location.id)}
                    className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-50"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Link>

                  {location.approvalStatus === LOCATION_STATUS.PENDING && (
                    <>
                      <Button
                        onClick={() => setConfirmTarget({ id: location.id, action: 'approve', name: location.name })}
                        disabled={actionLoading}
                        variant="primary"
                        size="sm"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Genehmigen
                      </Button>
                      <Button
                        onClick={() => setConfirmTarget({ id: location.id, action: 'reject', name: location.name })}
                        disabled={actionLoading}
                        variant="destructive"
                        size="sm"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Ablehnen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredLocations.length === 0 && (
            <div className="px-6 py-12 text-center">
              <MapPin className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
                {ADMIN_CONTENT.locations.emptyTitle}
              </Heading>
              <p className="text-text-secondary mb-4">
                {searchName.trim()
                  ? `Keine Orte für "${searchName}" gefunden.`
                  : filters.status !== 'all'
                  ? `Keine Orte mit Status "${LOCATION_STATUS_CONFIG[filters.status as keyof typeof LOCATION_STATUS_CONFIG]?.label ?? filters.status}" gefunden.`
                  : ADMIN_CONTENT.locations.emptyDescription}
              </p>
              <Button as={Link} href={ROUTES.admin.locationNew} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Ersten Ort erstellen
              </Button>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
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
