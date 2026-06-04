'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { LOCATION_STATUS, LOCATION_STATUS_COLORS, getLocationStatusLabel } from '@/config/location-status'
import { getBookingStatusBadge } from '@/config/booking-status'
import { LOCATION_TYPES } from '@/components/admin/locations/location-form'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useLocationDetail } from '@/hooks/useLocationDetail'
import { ROUTES } from '@/config/routes'
import {
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Loader2,
} from 'lucide-react'

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  [LOCATION_STATUS.APPROVED]: CheckCircle,
  [LOCATION_STATUS.PENDING]: Clock,
  [LOCATION_STATUS.REJECTED]: XCircle,
  [LOCATION_STATUS.SUSPENDED]: AlertCircle,
}

function getStatusBadge(status: string) {
  const Icon = STATUS_ICONS[status] ?? AlertCircle
  const className = LOCATION_STATUS_COLORS[status] ?? 'bg-surface-raised text-neutral-800'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4" />
      {getLocationStatusLabel(status)}
    </span>
  )
}

function getTypeLabel(type: string) {
  const found = LOCATION_TYPES.find((t) => t.id === type)
  const Icon = found?.icon ?? MapPin
  const label = found?.label ?? type
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
      <Icon className="w-4 h-4" />
      {label}
    </span>
  )
}

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const locationId = params.id as string

  const {
    location,
    bookings,
    loading,
    error,
    actionLoading,
    sessionStatus,
    pendingApprovalAction,
    handleApproval,
    confirmApproval,
    cancelApproval,
  } = useLocationDetail(locationId)

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-surface-raised py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-surface-base rounded-xl shadow-lg dark:shadow-black/30 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  if (error && !location) {
    return (
      <div className="min-h-screen bg-surface-raised py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-surface-base rounded-xl shadow-lg dark:shadow-black/30 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
            <Heading level={2} className="text-lg font-medium text-text-primary mb-2">{error}</Heading>
            <Link
              href={ROUTES.admin.locations}
              className="inline-flex items-center text-action hover:text-primary-700 mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück zur Ortsverwaltung
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!location) return null

  const accessibilityInfo = typeof location.accessibility_info === 'string'
    ? JSON.parse(location.accessibility_info)
    : location.accessibility_info

  return (
    <div className="min-h-screen bg-surface-raised">
      {/* Header */}
      <div className="bg-surface-base shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={ROUTES.admin.locations}
                  className="text-text-tertiary hover:text-neutral-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <Heading level={1} className="text-2xl font-bold text-text-primary">{location.name}</Heading>
                {getStatusBadge(location.approval_status)}
              </div>
              <div className="flex items-center gap-4 ml-8">
                {getTypeLabel(location.type)}
                {location.city && (
                  <span className="text-sm text-text-tertiary">
                    {location.city}{location.canton ? `, ${location.canton}` : ''}
                  </span>
                )}
              </div>
            </div>

            {location.approval_status === LOCATION_STATUS.PENDING && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproval('approve')}
                  disabled={actionLoading}
                  variant="primary"
                  size="sm"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Genehmigen
                </Button>
                <Button
                  onClick={() => handleApproval('reject')}
                  disabled={actionLoading}
                  variant="destructive"
                  size="sm"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                  Ablehnen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
            <p className="text-error-800 dark:text-error-400">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-surface-base rounded-xl shadow-sm border p-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Grundinformationen</Heading>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {location.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-text-tertiary">Beschreibung</dt>
                <dd className="mt-1 text-sm text-text-primary">{location.description}</dd>
              </div>
            )}
            {location.max_capacity && (
              <div>
                <dt className="text-sm font-medium text-text-tertiary">Kapazität</dt>
                <dd className="mt-1 text-sm text-text-primary flex items-center gap-1">
                  <Users className="w-4 h-4 text-text-muted" />
                  Max. {location.max_capacity} Personen
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Buchungen</dt>
              <dd className="mt-1 text-sm text-text-primary flex items-center gap-1">
                <Calendar className="w-4 h-4 text-text-muted" />
                {location.total_bookings} gesamt, {location.upcoming_bookings} bevorstehend
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Erstellt am</dt>
              <dd className="mt-1 text-sm text-text-primary">{formatDateShort(location.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Aktualisiert am</dt>
              <dd className="mt-1 text-sm text-text-primary">{formatDateShort(location.updated_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
        {(location.address_line1 || location.city) && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-text-muted" />
              Adresse
            </Heading>
            <div className="text-sm text-text-primary space-y-1">
              {location.address_line1 && <p>{location.address_line1}</p>}
              {location.address_line2 && <p>{location.address_line2}</p>}
              <p>
                {location.postal_code && `${location.postal_code} `}
                {location.city}
                {location.canton && `, ${location.canton}`}
              </p>
              {location.country && <p>{location.country}</p>}
            </div>
          </div>
        )}

        {/* Facilities */}
        {location.facilities && location.facilities.length > 0 && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Ausstattung</Heading>
            <div className="flex flex-wrap gap-2">
              {location.facilities.map((facility, i) => (
                <span key={i} className="px-3 py-1 bg-surface-raised text-text-secondary rounded-full text-sm">
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {accessibilityInfo && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Barrierefreiheit</Heading>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-text-tertiary">Rollstuhlgerecht</dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {accessibilityInfo.wheelchairAccessible ? 'Ja' : 'Nein'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-tertiary">Parkplätze</dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {accessibilityInfo.parkingAvailable ? 'Vorhanden' : 'Keine'}
                </dd>
              </div>
              {accessibilityInfo.publicTransport && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-text-tertiary">Öffentlicher Verkehr</dt>
                  <dd className="mt-1 text-sm text-text-primary">{accessibilityInfo.publicTransport}</dd>
                </div>
              )}
              {accessibilityInfo.additionalInfo && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-text-tertiary">Zusätzliche Informationen</dt>
                  <dd className="mt-1 text-sm text-text-primary">{accessibilityInfo.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Contact */}
        {(location.contact_name || location.contact_phone || location.contact_email) && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Kontakt</Heading>
            <dl className="space-y-3">
              {location.contact_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{location.contact_name}</span>
                </div>
              )}
              {location.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{location.contact_phone}</span>
                </div>
              )}
              {location.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{location.contact_email}</span>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Creator Info */}
        <div className="bg-surface-base rounded-xl shadow-sm border p-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Erstellt von</Heading>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-text-tertiary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{location.creator_name || 'Unbekannt'}</p>
              <p className="text-sm text-text-tertiary">{location.creator_email}</p>
            </div>
          </div>
        </div>

        {/* Review History */}
        {location.last_approval_action && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Letzte Prüfung</Heading>
            <div className="text-sm text-text-secondary space-y-2">
              <p>
                <span className="font-medium">Aktion:</span>{' '}
                {location.last_approval_action === 'approve' ? 'Genehmigt' : 'Abgelehnt'}
              </p>
              {location.last_reviewed_at && (
                <p>
                  <span className="font-medium">Datum:</span>{' '}
                  {formatDateShort(location.last_reviewed_at)}
                </p>
              )}
              {location.last_review_notes && (
                <p>
                  <span className="font-medium">Notizen:</span>{' '}
                  {location.last_review_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Bookings */}
        {bookings.length > 0 && (
          <div className="bg-surface-base rounded-xl shadow-sm border p-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Bevorstehende Buchungen</Heading>
            <div className="divide-y divide-neutral-200">
              {bookings.map((booking) => (
                <div key={booking.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDateShort(booking.start_time)} - {formatDateShort(booking.end_time)}
                    </p>
                    {booking.purpose && (
                      <p className="text-sm text-text-tertiary">{booking.purpose}</p>
                    )}
                    {booking.booked_by_name && (
                      <p className="text-xs text-text-tertiary">{booking.booked_by_name}</p>
                    )}
                  </div>
                  {(() => {
                    const badge = getBookingStatusBadge(booking.status)
                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    )
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingApprovalAction}
        title={pendingApprovalAction === 'approve' ? 'Ort genehmigen' : 'Ort ablehnen'}
        message={`Möchtest du diesen Ort wirklich ${pendingApprovalAction === 'approve' ? 'genehmigen' : 'ablehnen'}?`}
        itemName={location?.name}
        variant={pendingApprovalAction === 'approve' ? 'success' : 'danger'}
        onConfirm={confirmApproval}
        onClose={cancelApproval}
      />
    </div>
  )
}
