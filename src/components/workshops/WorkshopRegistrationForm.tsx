'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  CreditCard,
  Shield,
  FileText
} from 'lucide-react'
import { logger } from '@/lib/logger'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface Workshop {
  id: string
  slug: string
  title: string
  max_participants: number
  price_cents: number
}

interface WorkshopInstance {
  id: string
  start_date: string
  location: string
  status: string
  current_participants: number
}

interface WorkshopInstanceDetails {
  start_date: string
  location: string
  workshop_title: string
  workshop_slug: string
}

interface RegistrationData {
  id: string
  status: string
  registered_at: string
  workshop_instance?: WorkshopInstanceDetails
}

interface PaymentData {
  registrationId: string
  clientSecret: string
  amount: string
  invoiceNumber: string
}

interface WorkshopRegistrationFormProps {
  workshop: Workshop
  instance: WorkshopInstance
}

// Stripe Payment Form Component
function PaymentForm({
  clientSecret,
  onSuccess,
  onError
}: {
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/workshops`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'Ein Fehler ist aufgetreten.')
      onError(error.message || 'Payment failed')
      setIsLoading(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Zahlung erfolgreich!')
      onSuccess()
      setIsLoading(false)
    } else {
      setMessage('Zahlung wird verarbeitet...')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
        <Shield className="w-4 h-4 text-blue-600 mr-2" />
        <span className="text-sm text-blue-800">Sichere SSL-verschlüsselte Zahlung</span>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('erfolgreich')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Jetzt bezahlen
          </>
        )}
      </button>
    </form>
  )
}

export default function WorkshopRegistrationForm({ workshop, instance }: WorkshopRegistrationFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrationStatus, setRegistrationStatus] = useState<
    'checking' | 'not-registered' | 'registered' | 'registering' | 'payment' | 'processing' | 'success' | 'error'
  >('checking')
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string>('')

  const requiresPayment = workshop.price_cents > 0
  const isFull = instance.current_participants >= workshop.max_participants
  const spotsLeft = workshop.max_participants - instance.current_participants

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetch(`/api/workshops/registration/${instance.id}`)
        const data = await response.json()

        if (data.registered) {
          setRegistrationStatus('registered')
          setRegistrationData(data.registration)
        } else {
          setRegistrationStatus('not-registered')
        }
      } catch (err) {
        logger.error('Error checking registration', { error: err })
        setRegistrationStatus('error')
        setError('Fehler beim Laden des Anmeldestatus')
      }
    }

    if (session?.user) {
      checkRegistrationStatus()
    } else if (status !== 'loading') {
      const frame = requestAnimationFrame(() => setRegistrationStatus('not-registered'))
      return () => cancelAnimationFrame(frame)
    }
  }, [session, status, instance.id])

  const handleFreeRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationStatus('registering')
    setError('')

    try {
      const response = await fetch('/api/workshops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshopSlug: workshop.slug,
          instanceId: instance.id
        })
      })

      const data = await response.json()

      if (data.success) {
        setRegistrationStatus('registered')
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
        setRegistrationStatus('error')
        setError(data.error || 'Anmeldung fehlgeschlagen')
      }
    } catch (err) {
      setRegistrationStatus('error')
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const handlePaidRegistration = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setRegistrationStatus('processing')
    setError('')

    try {
      const response = await fetch(`/api/workshops/${workshop.slug}/register-with-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId: instance.id,
          useEscrow: false
        })
      })

      const data = await response.json()

      if (data.success) {
        setPaymentData({
          registrationId: data.registrationId,
          clientSecret: data.clientSecret,
          amount: data.amount,
          invoiceNumber: data.invoiceNumber
        })
        setRegistrationStatus('payment')
      } else {
        setRegistrationStatus('error')
        setError(data.message || data.error || 'Fehler beim Erstellen der Registrierung')
      }
    } catch (err) {
      setRegistrationStatus('error')
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const handlePaymentSuccess = () => {
    setRegistrationStatus('success')
    setRegistrationData({
      id: paymentData?.registrationId || '',
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
    }, 3000)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setRegistrationStatus('error')
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
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Für Workshop anmelden</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-blue-800 mb-2">
            <LogIn className="w-5 h-5 mr-2" />
            <span className="font-medium">Anmeldung erforderlich</span>
          </div>
          <p className="text-blue-700 text-sm">
            Bitte melden Sie sich an, um sich für diesen Workshop anzumelden.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Anmelden
          </Link>

          <Link
            href="/auth/register"
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Neues Konto erstellen
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (registrationStatus === 'success' || registrationStatus === 'registered') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop-Anmeldung</h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-green-800 mb-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Erfolgreich angemeldet!</span>
          </div>
          <p className="text-green-700 text-sm">
            {requiresPayment && registrationStatus === 'success'
              ? 'Ihre Zahlung wurde erfolgreich verarbeitet.'
              : 'Sie sind für diesen Workshop angemeldet.'
            }
            {' '}Details finden Sie in Ihrem Dashboard.
          </p>
        </div>

        {paymentData?.invoiceNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-gray-700 text-sm">
              <FileText className="w-4 h-4 mr-2" />
              <span>Rechnungsnummer: {paymentData.invoiceNumber}</span>
            </div>
          </div>
        )}

        <Link
          href="/dashboard/workshops"
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
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
          onClick={() => setRegistrationStatus('not-registered')}
          className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  // Payment step
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

        {/* Stripe Payment Form */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: paymentData.clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#16a34a',
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={paymentData.clientSecret}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>

        <button
          onClick={() => setRegistrationStatus('not-registered')}
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

      {/* Workshop Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span>{new Date(instance.start_date).toLocaleDateString('de-CH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span>{instance.location}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 text-gray-400 mr-2" />
            <span>{spotsLeft} Plätze verfügbar</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-green-600">
          {workshop.price_cents === 0 ? 'Kostenlos' : `CHF ${(workshop.price_cents / 100).toFixed(0)}`}
        </div>
        {workshop.price_cents > 0 && (
          <div className="text-sm text-gray-500">inkl. MwSt.</div>
        )}
      </div>

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
          ? 'Zahlung erfolgt sicher über Stripe.'
          : 'Sie erhalten eine Bestätigungs-E-Mail mit allen Details.'
        }
      </p>
    </div>
  )
}
