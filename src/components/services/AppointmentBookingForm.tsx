'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SUCCESS_MESSAGES } from '@/config/error-messages'
import { apiFetch } from '@/lib/api/client'
import { ROUTES } from '@/config/routes'
import { todayLocalIso } from '@/lib/utils/date'

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
  // Populate the date-input min after mount. Computing today client-side
  // gives the browser's local-tz today (correct for the user) instead of
  // UTC's today — without the deferral, SSR would render UTC's today and
  // the client would re-render with browser-tz today, producing a
  // hydration mismatch at the UTC-midnight boundary. Empty string before
  // mount means no min constraint is enforced for the brief window
  // between SSR and client mount — fine, the user can't interact that
  // fast anyway.
  const [minDate, setMinDate] = useState<string>('')
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMinDate(todayLocalIso()) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    const result = await apiFetch<{ message?: string }>('/api/appointments', {
      method: 'POST',
      body: {
        serviceSlug,
        description: formData.description,
        urgency: formData.urgency,
        preferredDate: formData.preferredDate && formData.preferredTime
          ? `${formData.preferredDate}T${formData.preferredTime}`
          : null
      }
    })

    if (result.success) {
      setSubmitResult({
        success: true,
        message: result.data?.message || SUCCESS_MESSAGES.APPOINTMENT_BOOKED
      })
      setFormData({ description: '', urgency: 'normal', preferredDate: '', preferredTime: '' })
      setTimeout(() => {
        setIsOpen(false)
        setSubmitResult(null)
        router.push('/dashboard/appointments')
      }, 2000)
    } else {
      setSubmitResult({
        success: false,
        message: result.error || 'Fehler beim Buchen des Termins'
      })
    }
    setIsSubmitting(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="primary" size="lg" className="mr-4">
        <Calendar className="w-5 h-5 inline mr-2" />
        Termin buchen
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-surface-overlay/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-surface-base dark:border dark:border-white/6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">
              Termin für {serviceTitle} buchen
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-text-tertiary hover:text-text-secondary min-w-[touch] min-h-[touch] touch-target -mr-2"
              aria-label="Schliessen"
            >
              ✕
            </Button>
          </div>

          {pricing && (
            <div className="bg-surface-raised border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center text-text-primary">
                <Wrench className="w-5 h-5 mr-2 shrink-0" />
                <span className="font-medium text-sm sm:text-base">Preis: {pricing}</span>
              </div>
            </div>
          )}

          {submitResult && (
            <div id={submitResult.success ? undefined : 'appointment-error'} className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              submitResult.success
                ? 'bg-success-50 border-success-200 text-success-800'
                : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800/30 text-error-800 dark:text-error-400'
            }`}>
              <div className="flex items-start">
                {submitResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                )}
                <span className="text-sm sm:text-base">{submitResult.message}</span>
              </div>
            </div>
          )}

          {!session?.user ? (
            <div className="text-center py-6 sm:py-8">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-warning-500 mx-auto mb-4" />
              <h4 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                Anmeldung erforderlich
              </h4>
              <p className="text-text-secondary mb-6 text-sm sm:text-base">
                Bitte melden Sie sich an, um einen Termin zu buchen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button as={Link} href={ROUTES.public.login} variant="primary">
                  Anmelden
                </Button>
                <Button as={Link} href={ROUTES.public.register} variant="outline">
                  Registrieren
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Problembeschreibung *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Beschreiben Sie Ihr Problem oder Ihren Bedarf so genau wie möglich..."
                  required
                  aria-required="true"
                  aria-invalid={!!(submitResult && !submitResult.success)}
                  aria-describedby={submitResult && !submitResult.success ? 'appointment-error' : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Dringlichkeit
                </label>
                <Select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as 'normal' | 'high' | 'urgent' }))}
                >
                  <option value="normal">Normal - Innerhalb 1-2 Wochen</option>
                  <option value="high">Hoch - Innerhalb weniger Tage</option>
                  <option value="urgent">Dringend - So schnell wie möglich</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Bevorzugtes Datum
                  </label>
                  <Input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                    min={minDate || undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Bevorzugte Zeit
                  </label>
                  <Input
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-surface-raised border-2 border rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-text-tertiary mt-0.5 mr-3 shrink-0" />
                  <div className="text-sm text-text-secondary">
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
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !formData.description.trim()}
                  className="flex-1"
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
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}



