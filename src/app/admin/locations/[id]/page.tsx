'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { formatDateShort } from '@/lib/date-formats'
import {
  MapPin,
  Building2,
  Home,
  Monitor,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  User,
  Loader2,
} from 'lucide-react'

interface LocationDetail {
  id: string
  name: string
  type: string
  description: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  canton: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  max_capacity: number | null
  facilities: string[] | null
  accessibility_info: {
    wheelchairAccessible?: boolean
    parkingAvailable?: boolean
    publicTransport?: string
    additionalInfo?: string
  } | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  approval_status: string
  created_at: string
  updated_at: string
  creator_name: string | null
  creator_email: string | null
  total_bookings: string
  upcoming_bookings: string
  last_approval_action: string | null
  last_reviewed_at: string | null
  last_review_notes: string | null
}

interface Booking {
  id: string
  start_time: string
  end_time: string
  purpose: string | null
  status: string
  booked_by_name: string | null
  booked_by_email: string | null
}

export default function LocationDetailPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const locationId = params.id as string

  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadLocation = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/locations/${locationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLocation(data.data.location)
          setBookings(data.data.recentBookings || [])
        } else {
          setError('Ort nicht gefunden')
        }
      } else if (response.status === 404) {
        setError('Ort nicht gefunden')
      } else {
        setError('Fehler beim Laden des Orts')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    if (sessionStatus === 'authenticated' && locationId) {
      loadLocation()
    }
  }, [sessionStatus, locationId, loadLocation])

  async function handleApproval(action: 'approve' | 'reject') {
    if (!confirm(`Möchten Sie diesen Ort wirklich ${action === 'approve' ? 'genehmigen' : 'ablehnen'}?`)) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/locations/${locationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          review_notes: action === 'reject' ? 'Administrative Prüfung' : 'Ort genehmigt'
        })
      })

      if (response.ok) {
        loadLocation()
      } else {
        setError('Fehler bei der Genehmigung')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
      approved: { icon: CheckCircle, label: 'Genehmigt', className: 'bg-green-100 text-green-800' },
      pending: { icon: Clock, label: 'Ausstehend', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { icon: XCircle, label: 'Abgelehnt', className: 'bg-red-100 text-red-800' },
      suspended: { icon: AlertCircle, label: 'Suspendiert', className: 'bg-orange-100 text-orange-800' },
    }
    const config = configs[status] || { icon: AlertCircle, label: status, className: 'bg-gray-100 text-gray-800' }
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { icon: typeof Building2; label: string }> = {
      venue: { icon: Building2, label: 'Veranstaltungsort' },
      home: { icon: Home, label: 'Zu Hause' },
      online: { icon: Monitor, label: 'Online' },
      community_center: { icon: Building2, label: 'Gemeinschaftszentrum' },
      business: { icon: Building2, label: 'Geschäft' },
    }
    const config = labels[type] || { icon: MapPin, label: type }
    const Icon = config.icon
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
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

  if (error && !location) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">{error}</h2>
            <Link
              href="/admin/locations"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-4"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/admin/locations"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                {getStatusBadge(location.approval_status)}
              </div>
              <div className="flex items-center gap-4 ml-8">
                {getTypeLabel(location.type)}
                {location.city && (
                  <span className="text-sm text-gray-500">
                    {location.city}{location.canton ? `, ${location.canton}` : ''}
                  </span>
                )}
              </div>
            </div>

            {location.approval_status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval('approve')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Genehmigen
                </button>
                <button
                  onClick={() => handleApproval('reject')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                  Ablehnen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {location.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                <dd className="mt-1 text-sm text-gray-900">{location.description}</dd>
              </div>
            )}
            {location.max_capacity && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kapazität</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  Max. {location.max_capacity} Personen
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Buchungen</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {location.total_bookings} gesamt, {location.upcoming_bookings} bevorstehend
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateShort(location.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Aktualisiert am</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateShort(location.updated_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
        {(location.address_line1 || location.city) && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Adresse
            </h2>
            <div className="text-sm text-gray-900 space-y-1">
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ausstattung</h2>
            <div className="flex flex-wrap gap-2">
              {location.facilities.map((facility, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {accessibilityInfo && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Barrierefreiheit</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Rollstuhlgerecht</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {accessibilityInfo.wheelchairAccessible ? 'Ja' : 'Nein'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Parkplätze</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {accessibilityInfo.parkingAvailable ? 'Vorhanden' : 'Keine'}
                </dd>
              </div>
              {accessibilityInfo.publicTransport && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Öffentlicher Verkehr</dt>
                  <dd className="mt-1 text-sm text-gray-900">{accessibilityInfo.publicTransport}</dd>
                </div>
              )}
              {accessibilityInfo.additionalInfo && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Zusätzliche Informationen</dt>
                  <dd className="mt-1 text-sm text-gray-900">{accessibilityInfo.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Contact */}
        {(location.contact_name || location.contact_phone || location.contact_email) && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h2>
            <dl className="space-y-3">
              {location.contact_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{location.contact_name}</span>
                </div>
              )}
              {location.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{location.contact_phone}</span>
                </div>
              )}
              {location.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{location.contact_email}</span>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Creator Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Erstellt von</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{location.creator_name || 'Unbekannt'}</p>
              <p className="text-sm text-gray-500">{location.creator_email}</p>
            </div>
          </div>
        </div>

        {/* Review History */}
        {location.last_approval_action && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Prüfung</h2>
            <div className="text-sm text-gray-600 space-y-2">
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bevorstehende Buchungen</h2>
            <div className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <div key={booking.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateShort(booking.start_time)} - {formatDateShort(booking.end_time)}
                    </p>
                    {booking.purpose && (
                      <p className="text-sm text-gray-500">{booking.purpose}</p>
                    )}
                    {booking.booked_by_name && (
                      <p className="text-xs text-gray-400">{booking.booked_by_name}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Bestätigt' :
                     booking.status === 'pending' ? 'Ausstehend' : booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
