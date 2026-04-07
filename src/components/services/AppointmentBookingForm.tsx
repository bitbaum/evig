'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { Modal } from '@/components/ui/Modal'

interface AppointmentBookingFormProps {
  serviceSlug: string
  serviceTitle: string
  pricing?: string
}

export default function AppointmentBookingForm({ serviceSlug, serviceTitle, pricing }: AppointmentBookingFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    urgency: 'normal' as 'normal' | 'high' | 'urgent',
    preferredDate: '',
    preferredTime: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const { data: result, error: apiError } = await apiFetch<{ message?: string }>('/api/appointments', {
        method: 'POST',
        body: {
          serviceSlug,
          description: formData.description,
          urgency: formData.urgency,
          preferredDate: formData.preferredDate && formData.preferredTime
            ? `${formData.preferredDate}T${formData.preferredTime}`
            : null
        },
      })

      if (!apiError) {
        setSubmitResult({
          success: true,
          message: result?.message || 'Termin erfolgreich gebucht!'
        })
        // Reset form
        setFormData({
          description: '',
          urgency: 'normal',
          preferredDate: '',
          preferredTime: ''
        })
        // Close modal after success
        setTimeout(() => {
          setIsOpen(false)
          setSubmitResult(null)
          // Redirect to dashboard to see the appointment
          router.push('/dashboard/appointments')
        }, 2000)
      } else {
        setSubmitResult({
          success: false,
          message: apiError,
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-block bg-primary-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-300 text-base sm:text-lg mr-4 min-h-[touch] touch-target"
      >
        <Calendar className="w-5 h-5 inline mr-2" />
        Termin buchen
      </button>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Termin für ${serviceTitle} buchen`}>
          {pricing && (
            <div className="bg-info-50 border border-info-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center text-info-800">
                <Wrench className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Preis: {pricing}</span>
              </div>
            </div>
          )}

          {submitResult && (
            <div id={submitResult.success ? undefined : 'appointment-error'} className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              submitResult.success
                ? 'bg-success-50 border-success-200 text-success-800'
                : 'bg-error-50 border-error-200 text-error-800'
            }`}>
              <div className="flex items-start">
                {submitResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm sm:text-base">{submitResult.message}</span>
              </div>
            </div>
          )}

          {!session?.user ? (
            <div className="text-center py-6 sm:py-8">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-warning-500 mx-auto mb-4" />
              <h4 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">
                Anmeldung erforderlich
              </h4>
              <p className="text-neutral-600 mb-6 text-sm sm:text-base">
                Bitte melden Sie sich an, um einen Termin zu buchen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[touch] touch-target text-center font-medium"
                >
                  Anmelden
                </Link>
                <Link
                  href="/auth/register"
                  className="border-2 border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg hover:bg-neutral-50 transition-colors min-h-[touch] touch-target text-center font-medium"
                >
                  Registrieren
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Problembeschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                  placeholder="Beschreiben Sie Ihr Problem oder Ihren Bedarf so genau wie möglich..."
                  required
                  aria-required="true"
                  aria-invalid={!!(submitResult && !submitResult.success)}
                  aria-describedby={submitResult && !submitResult.success ? 'appointment-error' : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Dringlichkeit
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as 'normal' | 'high' | 'urgent' }))}
                  className="w-full px-3 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base min-h-[touch] touch-target"
                >
                  <option value="normal">Normal - Innerhalb 1-2 Wochen</option>
                  <option value="high">Hoch - Innerhalb weniger Tage</option>
                  <option value="urgent">Dringend - So schnell wie möglich</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bevorzugtes Datum
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base min-h-[touch] touch-target"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bevorzugte Zeit
                  </label>
                  <input
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base min-h-[touch] touch-target"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 border-2 border-neutral-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-neutral-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-neutral-700">
                    <p className="font-medium mb-1">Was passiert als nächstes?</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Ihre Anfrage wird von unserem Team geprüft</li>
                      <li>Sie erhalten eine Terminbestätigung per E-Mail</li>
                      <li>Bei Fragen kontaktieren wir Sie für weitere Details</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors min-h-[touch] touch-target font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.description.trim()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[touch] touch-target font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird gebucht...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Termin buchen
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
    </Modal>
  )
}



