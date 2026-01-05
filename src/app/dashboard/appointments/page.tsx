'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, Clock, Wrench, AlertCircle, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ServiceAppointment {
  id: string
  service_name: string
  service_slug: string
  description: string | null
  urgency: string
  status: string
  preferred_date: string | null
  confirmed_date: string | null
  price_charged_cents: number | null
  outcome_notes: string | null
  created_at: string
  updated_at: string
}

export default function AppointmentsDashboard() {
  const { data: session, status } = useSession()
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState<string>('')
  const [editPreferredDate, setEditPreferredDate] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchAppointments()
    }
  }, [session])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      } else {
        setError('Fehler beim Laden der Termine')
      }
    } catch (error) {
      setError('Netzwerkfehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (apt: ServiceAppointment) => {
    setEditingId(apt.id)
    setEditDescription(apt.description || '')
    setEditPreferredDate(apt.preferred_date ? new Date(apt.preferred_date).toISOString().slice(0, 16) : '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const payload: { description: string; preferred_date?: string } = { description: editDescription }
      if (editPreferredDate) {
        // Convert local input (yyyy-MM-ddTHH:mm) to ISO
        const d = new Date(editPreferredDate)
        payload.preferred_date = d.toISOString()
      }
      const resp = await fetch(`/api/appointments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (resp.ok) {
        setEditingId(null)
        fetchAppointments()
      } else {
        alert('Speichern nicht möglich (nur im Status "Angefragt")')
      }
    } catch {
      alert('Netzwerkfehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-info-600" />
      case 'requested':
        return <AlertCircle className="w-5 h-5 text-warning-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Angefragt'
      case 'confirmed':
        return 'Bestätigt'
      case 'in_progress':
        return 'In Bearbeitung'
      case 'completed':
        return 'Abgeschlossen'
      case 'cancelled':
        return 'Storniert'
      default:
        return status
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
      case 'high':
        return 'text-error-700 bg-error-50 border border-error-200'
      case 'normal':
        return 'text-warning-700 bg-warning-50 border border-warning-200'
      case 'low':
        return 'text-success-700 bg-success-50 border border-success-200'
      default:
        return 'text-neutral-700 bg-neutral-50 border border-neutral-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-neutral-200 rounded w-1/3 mb-4 sm:mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-neutral-900">Anmeldung erforderlich</h1>
            <p className="text-neutral-600 mb-6 text-sm sm:text-base">
              Bitte melden Sie sich an, um Ihre Termine zu sehen.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[touch] touch-target font-medium"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meine Termine</h1>
          <p className="text-gray-600">
            Übersicht Ihrer Service-Termin-Anfragen und gebuchten Dienstleistungen
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Appointments */}
        {appointments.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-info-100 rounded-lg flex-shrink-0">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-info-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                        {appointment.service_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600 mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(appointment.status)}
                          <span className="ml-2">{getStatusText(appointment.status)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Beantragt am </span>
                          <span>{formatDate(appointment.created_at)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(appointment.urgency)}`}>
                          {appointment.urgency === 'urgent' ? 'Dringend' : appointment.urgency === 'high' ? 'Hoch' : appointment.urgency === 'normal' ? 'Normal' : 'Niedrig'}
                        </span>
                      </div>
                      {appointment.description && (
                        <p className="text-neutral-700 mb-3 text-sm sm:text-base">{appointment.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status specific content */}
                {appointment.status === 'requested' && (
                  <div className="bg-warning-50 border-2 border-warning-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-warning-800">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Terminanfrage ausstehend</span>
                    </div>
                    <p className="text-warning-700 text-xs sm:text-sm mt-1 ml-7">
                      Ihre Anfrage wird von unserem Team geprüft. Sie erhalten in Kürze eine Bestätigung per E-Mail.
                    </p>
                  </div>
                )}

                {appointment.status === 'confirmed' && (
                  <div className="bg-success-50 border-2 border-success-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-success-800">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Termin bestätigt!</span>
                    </div>
                    <p className="text-success-700 text-xs sm:text-sm mt-1 ml-7">
                      Ihr Termin wurde bestätigt. Sie erhalten weitere Details per E-Mail.
                    </p>
                  </div>
                )}

                {appointment.status === 'completed' && (
                  <div className="bg-info-50 border-2 border-info-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-info-800">
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Dienstleistung abgeschlossen</span>
                    </div>
                    {appointment.outcome_notes && (
                      <p className="text-info-700 text-xs sm:text-sm mt-1 ml-7">{appointment.outcome_notes}</p>
                    )}
                  </div>
                )}

                {appointment.status === 'cancelled' && (
                  <div className="bg-error-50 border-2 border-error-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center text-error-800">
                      <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Termin storniert</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {appointment.status !== 'cancelled' && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={async () => {
                        if (!confirm('Möchten Sie diesen Termin wirklich stornieren?')) return
                        try {
                          const resp = await fetch(`/api/appointments/${appointment.id}`, { method: 'PATCH' })
                          if (resp.ok) {
                            fetchAppointments()
                          } else {
                            alert('Stornierung fehlgeschlagen')
                          }
                        } catch {
                          alert('Netzwerkfehler bei der Stornierung')
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Termin stornieren
                    </button>
                    {appointment.status === 'requested' && (
                      <button
                        onClick={() => openEdit(appointment)}
                        className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        Angaben bearbeiten
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
              Noch keine Termine
            </h3>
            <p className="text-neutral-600 mb-6 text-sm sm:text-base">
              Sie haben noch keine Service-Termine gebucht.
            </p>
            <Link
              href="/services"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[touch] touch-target font-medium"
            >
              Dienstleistungen entdecken
            </Link>
          </div>
        )}
      </div>
      <Modal open={!!editingId} onClose={() => setEditingId(null)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Termindetails bearbeiten</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Problem oder Wunsch genauer beschreiben"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bevorzugtes Datum/Zeit</label>
              <input
                type="datetime-local"
                value={editPreferredDate}
                onChange={(e) => setEditPreferredDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-gray-300">Abbrechen</button>
            <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Simple modal
function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}





