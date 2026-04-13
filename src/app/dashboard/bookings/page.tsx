'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, AlertCircle, Wrench,
  Calendar, MapPin, Star, Euro, MessageSquare,
  ChevronRight, Loader2, RefreshCw, Home, Phone
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { BOOKING_STATUS_BADGES } from '@/config/booking-status'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface Appointment {
  id: string
  repairer_id: string
  description: string
  device_info: string | null
  preferred_date: string | null
  confirmed_date: string | null
  urgency: string
  status: string
  is_home_visit: boolean
  visit_address: string | null
  visit_city: string | null
  quoted_price_chf: number | null
  diagnosis_notes: string | null
  completion_notes: string | null
  customer_rating: number | null
  created_at: string
  repairer_name: string
  business_name: string | null
  service_name: string
}

const STATUS_CONFIG = BOOKING_STATUS_BADGES

export default function CustomerBookings() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<{ appointmentId: string; open: boolean } | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ appointments: Appointment[] }>('/api/appointments?role=customer')
      if (result.success) {
        setAppointments(result.data!.appointments)
      } else {
        setError(result.error || 'Fehler beim Laden')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
    } else if (sessionStatus === 'authenticated') {
      fetchAppointments()
    }
  }, [sessionStatus, router, fetchAppointments])

  const handleAction = async (appointmentId: string, action: string, extraData?: Record<string, unknown>) => {
    setActionLoading(appointmentId)
    try {
      const result = await apiFetch<void>('/api/appointments/' + appointmentId, {
        method: 'PATCH',
        body: { action, ...extraData }
      })
      if (result.success) {
        fetchAppointments()
        setRatingModal(null)
        setRating(5)
        setReview('')
      } else {
        setError(result.error || 'Aktion fehlgeschlagen')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'active') return !['completed', 'rejected', 'cancelled'].includes(apt.status)
    return ['completed', 'rejected', 'cancelled'].includes(apt.status)
  })

  const activeCount = appointments.filter(a => !['completed', 'rejected', 'cancelled'].includes(a.status)).length
  const needsAction = appointments.filter(a => a.status === 'quoted').length

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900">Meine Buchungen</Heading>
            <p className="text-neutral-600">Deine Reparaturaufträge im Überblick</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAppointments}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border rounded-lg hover:bg-neutral-50 text-sm md:text-base"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>
            <Link
              href="/techniker"
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
            >
              <Wrench className="h-4 w-4" />
              Neuer Auftrag
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {needsAction > 0 && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-purple-700">
            <Euro className="h-5 w-5" />
            Du hast {needsAction} Angebot{needsAction > 1 ? 'e' : ''} zur Bestätigung
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-white text-neutral-600 hover:bg-neutral-50')}
          >
            <Clock className="h-4 w-4" />
            Aktiv
            {activeCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{activeCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-white text-neutral-600 hover:bg-neutral-50')}
          >
            <CheckCircle className="h-4 w-4" />
            Abgeschlossen
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <Wrench className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">Keine Buchungen in dieser Kategorie</p>
              <Link
                href="/techniker"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Techniker finden
              </Link>
            </div>
          ) : (
            filteredAppointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                  <div>
                    <span className={'px-3 py-1 rounded-full text-sm font-medium ' +
                      (STATUS_CONFIG[apt.status]?.color || 'bg-neutral-100')}>
                      {STATUS_CONFIG[apt.status]?.label || apt.status}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">{STATUS_CONFIG[apt.status]?.description}</p>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    {formatDateShort(apt.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Heading level={3} className="font-semibold text-neutral-900">{apt.business_name || apt.repairer_name}</Heading>
                    <p className="text-sm text-neutral-500">{apt.service_name || 'Reparatur'}</p>
                  </div>
                </div>

                <p className="text-neutral-700 mb-4">{apt.description}</p>

                {apt.quoted_price_chf && (
                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Angebot</p>
                        <p className="text-2xl font-bold text-purple-900">CHF {apt.quoted_price_chf}</p>
                      </div>
                      {apt.diagnosis_notes && (
                        <p className="text-sm text-purple-700 sm:max-w-xs">{apt.diagnosis_notes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
                  {apt.preferred_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateShort(apt.preferred_date)}
                    </div>
                  )}
                  {apt.is_home_visit && (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      Hausbesuch
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {apt.status === 'quoted' && (
                    <>
                      <button
                        onClick={() => handleAction(apt.id, 'approve_quote')}
                        disabled={actionLoading === apt.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Angebot annehmen
                      </button>
                      <button
                        onClick={() => handleAction(apt.id, 'reject_quote')}
                        disabled={actionLoading === apt.id}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Ablehnen
                      </button>
                    </>
                  )}

                  {apt.status === 'completed' && !apt.customer_rating && (
                    <button
                      onClick={() => setRatingModal({ appointmentId: apt.id, open: true })}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Bewertung abgeben
                    </button>
                  )}

                  {['requested', 'accepted', 'quoted', 'quote_approved'].includes(apt.status) && (
                    <button
                      onClick={() => handleAction(apt.id, 'cancel')}
                      disabled={actionLoading === apt.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Stornieren
                    </button>
                  )}

                  <Link
                    href={'/dashboard/bookings/' + apt.id}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 flex items-center gap-2 sm:ml-auto"
                  >
                    Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rating Modal */}
        <Modal isOpen={!!ratingModal?.open} onClose={() => setRatingModal(null)} title="Bewertung abgeben" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Bewertung</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={'h-8 w-8 ' + (star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300')}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Kommentar (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Wie war deine Erfahrung?"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setRatingModal(null)}
              className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
            >
              Abbrechen
            </button>
            <button
              onClick={() => ratingModal && handleAction(ratingModal.appointmentId, 'rate', {
                customer_rating: rating,
                customer_review: review || undefined
              })}
              disabled={actionLoading !== null}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Bewertung senden'}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
