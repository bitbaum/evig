'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_REGISTRATION_STATUS_LABELS } from '@/config/workshop-registration-status'
import Link from 'next/link'
import { getTextColor, getStatusColors } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-formats'

interface WorkshopRegistration {
  id: string
  workshop_title: string
  workshop_slug: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  attended: boolean
  rating: number | null
  feedback: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export default function WorkshopsDashboard() {
  const { data: session, status } = useSession()
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState<number>(5)
  const [editFeedback, setEditFeedback] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchRegistrations()
    }
  }, [session])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/user/workshop-registrations')
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.data?.registrations || [])
      } else {
        setError('Fehler beim Laden der Workshop-Anmeldungen')
      }
    } catch (error) {
      setError('Netzwerkfehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (reg: WorkshopRegistration) => {
    setEditingId(reg.id)
    setEditRating(reg.rating || 5)
    setEditFeedback(reg.feedback || '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const resp = await fetch(`/api/workshops/registrations/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, feedback: editFeedback })
      })
      if (resp.ok) {
        setEditingId(null)
        fetchRegistrations()
      } else {
        alert('Speichern fehlgeschlagen')
      }
    } catch {
      alert('Netzwerkfehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case WORKSHOP_REGISTRATION_STATUS.CONFIRMED:
        return <CheckCircle className="w-5 h-5 text-success-500" />
      case WORKSHOP_REGISTRATION_STATUS.PENDING:
        return <AlertCircle className="w-5 h-5 text-warning-500" />
      case WORKSHOP_REGISTRATION_STATUS.CANCELLED:
        return <XCircle className="w-5 h-5 text-error-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusText = (status: string) => WORKSHOP_REGISTRATION_STATUS_LABELS[status] ?? status


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-neutral-200">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6"></div>
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
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-neutral-200">
            <h1 className={cn('text-2xl font-bold mb-4', getTextColor('white', 'primary'))}>Anmeldung erforderlich</h1>
            <p className={cn('mb-6', getTextColor('white', 'muted'))}>
              Bitte melden Sie sich an, um Ihre Workshop-Anmeldungen zu sehen.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[touch] touch-target"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className={cn('inline-flex items-center mb-4', getTextColor('neutral', 'muted'), 'hover:text-primary-600')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <h1 className={cn('text-3xl font-bold mb-2', getTextColor('neutral', 'primary'))}>Meine Workshops</h1>
          <p className={cn('text-sm sm:text-base', getTextColor('neutral', 'muted'))}>
            Übersicht Ihrer Workshop-Anmeldungen und Teilnahmen
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn('rounded-lg p-4 mb-6 border-2', getStatusColors('error').bg, getStatusColors('error').border)}>
            <p className={cn('text-sm', getStatusColors('error').text)}>{error}</p>
          </div>
        )}

        {/* Registrations */}
        {registrations.length > 0 ? (
          <div className="space-y-6">
            {registrations.map((registration) => (
              <div key={registration.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-neutral-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={cn('text-xl font-semibold mb-2', getTextColor('white', 'primary'))}>
                      {registration.workshop_title}
                    </h3>
                    <div className={cn('flex items-center gap-4 text-sm mb-3', getTextColor('white', 'muted'))}>
                      <div className="flex items-center">
                        {getStatusIcon(registration.status)}
                        <span className="ml-2">{getStatusText(registration.status)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Angemeldet am {formatDate(registration.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status specific content */}
                {registration.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center text-primary-800">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Ihre Anmeldung wurde bestätigt!</span>
                    </div>
                    <p className="text-primary-700 text-sm mt-1">
                      Sie erhalten in Kürze weitere Informationen zu Datum und Ort.
                    </p>
                  </div>
                )}

                {registration.status === WORKSHOP_REGISTRATION_STATUS.PENDING && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-center text-warning-800">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Anmeldung ausstehend</span>
                    </div>
                    <p className="text-warning-700 text-sm mt-1">
                      Ihre Anmeldung wird von unserem Team geprüft. Sie erhalten eine Bestätigung per E-Mail.
                    </p>
                  </div>
                )}

                {registration.status === WORKSHOP_REGISTRATION_STATUS.CANCELLED && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    <div className="flex items-center text-error-800">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Anmeldung storniert</span>
                    </div>
                    {registration.cancelled_at && (
                      <p className="text-error-700 text-sm mt-1">
                        Storniert am {formatDate(registration.cancelled_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {registration.status !== WORKSHOP_REGISTRATION_STATUS.CANCELLED && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={async () => {
                        if (!confirm('Möchten Sie diese Anmeldung wirklich stornieren?')) return
                        try {
                          const resp = await fetch(`/api/workshops/registrations/${registration.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'cancel' })
                          })
                          if (resp.ok) {
                            fetchRegistrations()
                          } else {
                            alert('Stornierung fehlgeschlagen')
                          }
                        } catch {
                          alert('Netzwerkfehler bei der Stornierung')
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    >
                      Anmeldung stornieren
                    </button>
                    <button
                      onClick={() => openEdit(registration)}
                      className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      {registration.feedback || registration.rating ? 'Feedback bearbeiten' : 'Feedback hinzufügen'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Noch keine Workshop-Anmeldungen
            </h3>
            <p className="text-neutral-600 mb-6">
              Sie haben sich noch für keine Workshops angemeldet.
            </p>
            <Link
              href="/workshops"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Workshops entdecken
            </Link>
          </div>
        )}
      </div>

      <Modal open={!!editingId} onClose={() => setEditingId(null)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Feedback bearbeiten</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Bewertung (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={editRating}
                onChange={(e) => setEditRating(Math.max(1, Math.min(5, Number(e.target.value))))}
                className="w-24 px-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Feedback</label>
              <textarea
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                placeholder="Wie war Ihre Erfahrung?"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-neutral-300">Abbrechen</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}





