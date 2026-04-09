'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, AlertCircle, Wrench,
  Calendar, MapPin, User, Euro, MessageSquare,
  ChevronRight, Loader2, RefreshCw, Home, Building
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatDateShort } from '@/lib/date-formats'
import { BOOKING_STATUS } from '@/config/booking-status'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface Appointment {
  id: string
  user_id: string
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
  created_at: string
  customer_name: string
  customer_email: string
  service_name: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  [BOOKING_STATUS.REQUESTED]: { label: 'Anfrage', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  [BOOKING_STATUS.ACCEPTED]: { label: 'Angenommen', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  [BOOKING_STATUS.QUOTED]: { label: 'Angebot gesendet', color: 'bg-purple-100 text-purple-800', icon: Euro },
  [BOOKING_STATUS.QUOTE_APPROVED]: { label: 'Angebot bestätigt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [BOOKING_STATUS.QUOTE_REJECTED]: { label: 'Angebot abgelehnt', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  [BOOKING_STATUS.IN_PROGRESS]: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  [BOOKING_STATUS.COMPLETED]: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [BOOKING_STATUS.REJECTED]: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800', icon: XCircle },
  [BOOKING_STATUS.CANCELLED]: { label: 'Storniert', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

export default function RepairerDashboard() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending')
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

  const handleSubmitQuote = () => {
    if (!quoteModal || !quotePrice) return
    handleAction(quoteModal.appointmentId, 'quote', {
      quoted_price_chf: parseFloat(quotePrice),
      diagnosis_notes: quoteDiagnosis || undefined
    })
  }

  const activeStatuses = [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED, BOOKING_STATUS.QUOTE_REJECTED, BOOKING_STATUS.IN_PROGRESS] as string[]
  const terminalStatuses = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED] as string[]

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'pending') return apt.status === BOOKING_STATUS.REQUESTED
    if (activeTab === 'active') return activeStatuses.includes(apt.status)
    return terminalStatuses.includes(apt.status)
  })

  const pendingCount = appointments.filter(a => a.status === BOOKING_STATUS.REQUESTED).length
  const activeCount = appointments.filter(a => activeStatuses.includes(a.status)).length

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Heading level={1} className="text-2xl font-bold text-gray-900">Reparateur Dashboard</Heading>
            <p className="text-gray-600">Verwalten Sie Ihre Aufträge</p>
          </div>
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <Clock className="h-4 w-4" />
            Anfragen
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <Wrench className="h-4 w-4" />
            Aktiv
            {activeCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{activeCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={'px-4 py-2 rounded-lg font-medium flex items-center gap-2 ' +
              (activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >
            <CheckCircle className="h-4 w-4" />
            Abgeschlossen
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Keine Termine in dieser Kategorie
            </div>
          ) : (
            filteredAppointments.map(apt => {
              const StatusIcon = STATUS_CONFIG[apt.status]?.icon || Clock
              return (
                <div key={apt.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ' +
                          (STATUS_CONFIG[apt.status]?.color || 'bg-gray-100')}>
                          <StatusIcon className="h-4 w-4" />
                          {STATUS_CONFIG[apt.status]?.label || apt.status}
                        </span>
                        {apt.urgency === 'urgent' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Dringend</span>
                        )}
                        {apt.is_home_visit && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                            <Home className="h-3 w-3" /> Hausbesuch
                          </span>
                        )}
                      </div>
                      <Heading level={3} className="font-semibold text-lg text-gray-900">{apt.service_name || 'Reparatur'}</Heading>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{formatDateShort(apt.created_at)}</div>
                      {apt.quoted_price_chf && (
                        <div className="font-semibold text-green-600">CHF {apt.quoted_price_chf}</div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{apt.description}</p>

                  {apt.device_info && (
                    <p className="text-sm text-gray-500 mb-4">Gerät: {apt.device_info}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {apt.customer_name}
                    </div>
                    {apt.preferred_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateShort(apt.preferred_date)}
                      </div>
                    )}
                    {apt.is_home_visit && apt.visit_city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {apt.visit_city}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {apt.status === BOOKING_STATUS.REQUESTED && (
                      <>
                        <button
                          onClick={() => handleAction(apt.id, 'accept')}
                          disabled={actionLoading === apt.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Annehmen
                        </button>
                        <button
                          onClick={() => handleAction(apt.id, 'reject')}
                          disabled={actionLoading === apt.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Ablehnen
                        </button>
                      </>
                    )}

                    {(apt.status === BOOKING_STATUS.ACCEPTED || apt.status === BOOKING_STATUS.QUOTE_REJECTED) && (
                      <>
                        <button
                          onClick={() => setQuoteModal({ appointmentId: apt.id, open: true })}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                          <Euro className="h-4 w-4" />
                          Angebot senden
                        </button>
                        <button
                          onClick={() => handleAction(apt.id, 'start')}
                          disabled={actionLoading === apt.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Wrench className="h-4 w-4" />
                          Direkt starten
                        </button>
                      </>
                    )}

                    {apt.status === BOOKING_STATUS.QUOTE_APPROVED && (
                      <button
                        onClick={() => handleAction(apt.id, 'start')}
                        disabled={actionLoading === apt.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                        Reparatur starten
                      </button>
                    )}

                    {apt.status === BOOKING_STATUS.IN_PROGRESS && (
                      <button
                        onClick={() => handleAction(apt.id, 'complete')}
                        disabled={actionLoading === apt.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Abschliessen
                      </button>
                    )}

                    <Link
                      href={'/dashboard/repairer/appointments/' + apt.id}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 ml-auto"
                    >
                      Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Quote Modal */}
        <Modal isOpen={!!quoteModal?.open} onClose={() => setQuoteModal(null)} title="Angebot erstellen" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preis (CHF)</label>
              <input
                type="number"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="z.B. 150"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnose / Anmerkungen</label>
              <textarea
                value={quoteDiagnosis}
                onChange={(e) => setQuoteDiagnosis(e.target.value)}
                placeholder="Beschreibung des Problems und der geplanten Reparatur..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setQuoteModal(null)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmitQuote}
              disabled={!quotePrice || actionLoading !== null}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Angebot senden'}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
