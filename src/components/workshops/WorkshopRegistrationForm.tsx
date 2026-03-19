'use client'

/**
 * Workshop Registration Form
 *
 * Refactored to use extracted components for better maintainability.
 * Uses Payrexx redirect-based payment (no embedded Stripe Elements).
 *
 * Components extracted:
 * - PaymentForm
 * - WorkshopLoginPrompt
 * - WorkshopInstanceCard
 * - RegistrationSuccessCard
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { logger } from '@/lib/logger'
import {
  PaymentForm,
  WorkshopLoginPrompt,
  WorkshopInstanceCard,
  RegistrationSuccessCard,
  type Workshop,
  type WorkshopInstanceWithCount,
  type RegistrationData,
  type PaymentData,
  type RegistrationUIStatus,
} from './index'

interface WorkshopRegistrationFormProps {
  workshop: Workshop
  instance: WorkshopInstanceWithCount
}

export default function WorkshopRegistrationForm({ workshop, instance }: WorkshopRegistrationFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationUIStatus] = useState<RegistrationUIStatus>('checking')
  // Registration data stored for potential future use (e.g., showing details in success state)
  const [_registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string>('')

  const requiresPayment = workshop.price_cents > 0
  const isFull = instance.current_participants >= workshop.max_participants
  const spotsLeft = workshop.max_participants - instance.current_participants

  useEffect(() => {
    const checkRegistrationUIStatus = async () => {
      try {
        const response = await fetch(`/api/workshops/registration/${instance.id}`)
        const data = await response.json()

        if (data.registered) {
          setRegistrationUIStatus('registered')
          setRegistrationData(data.registration)
        } else {
          setRegistrationUIStatus('not-registered')
        }
      } catch (err) {
        logger.error('Error checking registration', { error: err })
        setRegistrationUIStatus('error')
        setError('Fehler beim Laden des Anmeldestatus')
      }
    }

    if (session?.user) {
      checkRegistrationUIStatus()
    } else if (status !== 'loading') {
      const frame = requestAnimationFrame(() => setRegistrationUIStatus('not-registered'))
      return () => cancelAnimationFrame(frame)
    }
  }, [session, status, instance.id])

  const handleFreeRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationUIStatus('registering')
    setError('')

    try {
      const response = await fetch('/api/workshops/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopSlug: workshop.slug,
          instanceId: instance.id
        })
      })

      const data = await response.json()

      if (data.success) {
        setRegistrationUIStatus('registered')
        setRegistrationData({
          id: data.registrationId,
          status: 'confirmed',
          registered_at: new Date().toISOString(),
          workshop_instance: {
            start_date: instance.start_date,
            location: instance.location,
            workshop_title: workshop.title,
            workshop_slug: workshop.slug
          }
        })

        setTimeout(() => {
          router.push('/dashboard/workshops')
        }, 2000)
      } else {
        setRegistrationUIStatus('error')
        setError(data.error || 'Anmeldung fehlgeschlagen')
      }
    } catch {
      setRegistrationUIStatus('error')
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const handlePaidRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationUIStatus('processing')
    setError('')

    try {
      const response = await fetch(`/api/workshops/${workshop.slug}/register-with-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: instance.id,
          useEscrow: false
        })
      })

      const data = await response.json()

      if (data.success) {
        setPaymentData({
          registrationId: data.registrationId,
          paymentUrl: data.paymentUrl,
          amount: data.amount,
          invoiceNumber: data.invoiceNumber
        })
        setRegistrationUIStatus('payment')
      } else {
        setRegistrationUIStatus('error')
        setError(data.message || data.error || 'Fehler beim Erstellen der Registrierung')
      }
    } catch {
      setRegistrationUIStatus('error')
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  // Loading state
  if (status === 'loading' || registrationStatus === 'checking') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
        <p className="text-gray-600">Lade Anmeldestatus...</p>
      </div>
    )
  }

  // Not logged in
  if (!session?.user) {
    return <WorkshopLoginPrompt />
  }

  // Success state
  if (registrationStatus === 'success' || registrationStatus === 'registered') {
    return (
      <RegistrationSuccessCard
        requiresPayment={requiresPayment}
        isPaymentSuccess={registrationStatus === 'success'}
        invoiceNumber={paymentData?.invoiceNumber}
      />
    )
  }

  // Full workshop
  if (isFull) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop ausgebucht</h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-red-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Keine Plätze mehr verfügbar</span>
          </div>
          <p className="text-red-700 text-sm">
            Dieser Workshop ist bereits ausgebucht. Schauen Sie regelmässig vorbei für neue Termine.
          </p>
        </div>

        <button
          disabled
          className="w-full px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Ausgebucht
        </button>
      </div>
    )
  }

  // Error state
  if (registrationStatus === 'error') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fehler</h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-red-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Ein Fehler ist aufgetreten</span>
          </div>
          <p className="text-red-700 text-sm">{error}</p>
        </div>

        <button
          onClick={() => setRegistrationUIStatus('not-registered')}
          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  // Payment step — show summary + redirect button
  if (registrationStatus === 'payment' && paymentData) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zahlung abschliessen</h3>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Workshop</span>
              <span className="font-medium">{workshop.title}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Betrag</span>
              <span className="font-semibold text-green-600">CHF {paymentData.amount}</span>
            </div>
          </div>
        </div>

        {/* Payrexx Payment Form (redirect button) */}
        <PaymentForm
          paymentUrl={paymentData.paymentUrl}
          amount={paymentData.amount}
        />

        <button
          onClick={() => setRegistrationUIStatus('not-registered')}
          className="w-full mt-3 px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    )
  }

  // Processing state
  if (registrationStatus === 'processing' || registrationStatus === 'registering') {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
        <p className="text-gray-600">
          {registrationStatus === 'processing'
            ? 'Zahlung wird vorbereitet...'
            : 'Wird angemeldet...'
          }
        </p>
      </div>
    )
  }

  // Default: Registration form
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Für Workshop anmelden</h3>

      <WorkshopInstanceCard
        instance={instance}
        spotsLeft={spotsLeft}
        priceCents={workshop.price_cents}
      />

      {/* Registration Button */}
      <button
        onClick={requiresPayment ? handlePaidRegistration : handleFreeRegistration}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        {requiresPayment ? (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Anmelden & bezahlen
          </>
        ) : (
          'Für Workshop anmelden'
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        {requiresPayment
          ? 'Sichere Zahlung über unseren Zahlungsanbieter.'
          : 'Sie erhalten eine Bestätigungs-E-Mail mit allen Details.'
        }
      </p>
    </div>
  )
}
