'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  User, Loader2, RefreshCw, Wrench, Home, ChevronRight, Send
} from 'lucide-react'
import { BOOKING_STATUS, getBookingStatusBadge, getUrgencyBadge } from '@/config/booking-status'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface Appointment {
  id: string
  user_id: string
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
  customer_name: string
  customer_email: string
  repairer_name: string
  business_name: string | null
  service_name: string
}

export default function RepairerBookingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [quoteModal, setQuoteModal] = useState<{ appointmentId: string; open: boolean } | null>(null)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteDiagnosis, setQuoteDiagnosis] = useState('')

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch<{ appointments: Appointment[] }>('/api/appointments?role=repairer')
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
        setQuoteModal(null)
        setQuotePrice('')
        setQuoteDiagnosis('')
      } else {
        setError(result.error || 'Aktion fehlgeschlagen')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setActionLoading(null)
    }
  }

  const terminalStatuses: string[] = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED]
  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'active') return !terminalStatuses.includes(apt.status)
    return terminalStatuses.includes(apt.status)
  })

  const activeCount = appointments.filter(a => !terminalStatuses.includes(a.status)).length
  const requestedCount = appointments.filter(a => a.status === BOOKING_STATUS.REQUESTED).length

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
            Reparatur-Buchungen
          </Heading>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre eingehenden Reparaturaufträge
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Action needed banner */}
      {requestedCount > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <AlertCircle className="h-5 w-5" />
          Sie haben {requestedCount} neue Anfrage{requestedCount > 1 ? 'n' : ''} zur Bearbeitung
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Neue Anfragen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => a.status === BOOKING_STATUS.REQUESTED).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Angenommen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => ([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(a.status)).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Bearbeitung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => a.status === BOOKING_STATUS.IN_PROGRESS).length}
              </p>
            </div>
            <Wrench className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => a.status === BOOKING_STATUS.COMPLETED).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
            (activeTab === 'active'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700')}
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
            (activeTab === 'completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700')}
        >
          <CheckCircle className="h-4 w-4" />
          Abgeschlossen
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Wrench className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Keine Buchungen in dieser Kategorie</p>
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const statusBadge = getBookingStatusBadge(apt.status)
            const urgencyBadge = getUrgencyBadge(apt.urgency)

            return (
              <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  {/* Header: Status + Date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={'px-3 py-1 rounded-full text-sm font-medium ' + statusBadge.color}>
                        {statusBadge.label}
                      </span>
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + urgencyBadge.color}>
                        {urgencyBadge.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDateShort(apt.created_at)}
                    </span>
                  </div>

                  {/* Customer + Service Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <Heading level={3} className="font-semibold text-gray-900 dark:text-white">{apt.customer_name || 'Kunde'}</Heading>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{apt.service_name || 'Reparatur'}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">{apt.description}</p>

                  {/* Quote Display */}
                  {apt.quoted_price_chf && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Ihr Angebot</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">CHF {apt.quoted_price_chf}</p>
                        </div>
                        {apt.diagnosis_notes && (
                          <p className="text-sm text-purple-700 dark:text-purple-300 max-w-xs">{apt.diagnosis_notes}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {apt.preferred_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Wunschtermin: {formatDateShort(apt.preferred_date)}
                      </div>
                    )}
                    {apt.confirmed_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Bestätigt: {formatDateShort(apt.confirmed_date)}
                      </div>
                    )}
                    {apt.is_home_visit && (
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        Hausbesuch{apt.visit_city ? ` - ${apt.visit_city}` : ''}
                      </div>
                    )}
                    {apt.device_info && (
                      <div className="flex items-center gap-1">
                        <Wrench className="h-4 w-4" />
                        {apt.device_info}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {apt.status === BOOKING_STATUS.REQUESTED && (
                      <>
                        <Button
                          onClick={() => handleAction(apt.id, 'accept')}
                          disabled={actionLoading === apt.id}
                          size="sm"
                          className="gap-2"
                        >
                          {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Annehmen
                        </Button>
                        <button
                          onClick={() => handleAction(apt.id, 'reject')}
                          disabled={actionLoading === apt.id}
                          className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Ablehnen
                        </button>
                      </>
                    )}

                    {([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_REJECTED] as string[]).includes(apt.status) && (
                      <button
                        onClick={() => setQuoteModal({ appointmentId: apt.id, open: true })}
                        disabled={actionLoading === apt.id}
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Angebot erstellen
                      </button>
                    )}

                    {([BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_APPROVED] as string[]).includes(apt.status) && (
                      <Button
                        onClick={() => handleAction(apt.id, 'start')}
                        disabled={actionLoading === apt.id}
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                        Reparatur starten
                      </Button>
                    )}

                    {apt.status === BOOKING_STATUS.IN_PROGRESS && (
                      <Button
                        onClick={() => handleAction(apt.id, 'complete')}
                        disabled={actionLoading === apt.id}
                        size="sm"
                        className="gap-2"
                      >
                        {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Abgeschlossen
                      </Button>
                    )}

                    <Link
                      href={'/dashboard/repairer/bookings/' + apt.id}
                      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 ml-auto"
                    >
                      Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quote Modal */}
      <Modal
        isOpen={!!quoteModal?.open}
        onClose={() => { setQuoteModal(null); setQuotePrice(''); setQuoteDiagnosis('') }}
        title="Angebot erstellen"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preis (CHF)
            </label>
            <input
              type="number"
              value={quotePrice}
              onChange={(e) => setQuotePrice(e.target.value)}
              placeholder="z.B. 150"
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Diagnose / Notizen (optional)
            </label>
            <textarea
              value={quoteDiagnosis}
              onChange={(e) => setQuoteDiagnosis(e.target.value)}
              placeholder="Beschreiben Sie das Problem und die geplante Reparatur..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button
            onClick={() => { setQuoteModal(null); setQuotePrice(''); setQuoteDiagnosis('') }}
            variant="secondary"
            className="flex-1"
          >
            Abbrechen
          </Button>
          <button
            onClick={() => {
              if (!quoteModal) return
              const price = parseFloat(quotePrice)
              if (!price || price <= 0) {
                setError('Bitte geben Sie einen gültigen Preis ein')
                return
              }
              handleAction(quoteModal.appointmentId, 'quote', {
                quoted_price_chf: price,
                diagnosis_notes: quoteDiagnosis || undefined
              })
            }}
            disabled={actionLoading !== null}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Angebot senden'}
          </button>
        </div>
      </Modal>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              Tipps für die Buchungsverwaltung
            </Heading>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Antworten Sie schnell auf neue Buchungsanfragen (innerhalb 24h)</li>
              <li>Kommunizieren Sie klar über Preise und Lieferzeiten</li>
              <li>Dokumentieren Sie den Zustand der Geräte vor der Reparatur</li>
              <li>Halten Sie Ihre Kunden über den Fortschritt auf dem Laufenden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
