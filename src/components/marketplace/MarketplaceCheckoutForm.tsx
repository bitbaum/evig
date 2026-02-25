'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2, Shield, CheckCircle } from 'lucide-react'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

interface CheckoutFormInnerProps {
  orderId?: string
  onSuccess: () => void
  onError: (message: string) => void
}

function CheckoutFormInner({ orderId, onSuccess, onError }: CheckoutFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) return

    setIsLoading(true)
    setMessage('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/marketplace/checkout/success${orderId ? `?orderId=${orderId}` : ''}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'Ein Fehler ist aufgetreten.')
      onError(error.message || 'Zahlung fehlgeschlagen')
      setIsLoading(false)
    } else if (paymentIntent) {
      // For manual capture, status will be 'requires_capture' not 'succeeded'
      if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
        setMessage('Zahlung erfolgreich!')
        onSuccess()
      } else {
        setMessage('Unerwarteter Status. Bitte kontaktieren Sie den Support.')
      }
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800 dark:text-green-300">Sichere SSL-verschlüsselte Zahlung</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800 dark:text-green-300">Käuferschutz</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('erfolgreich')
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Sicher bezahlen
          </>
        )}
      </button>
    </form>
  )
}

interface MarketplaceCheckoutFormProps {
  clientSecret: string
  orderId?: string
  onSuccess: () => void
  onError: (message: string) => void
}

export default function MarketplaceCheckoutForm({
  clientSecret,
  orderId,
  onSuccess,
  onError,
}: MarketplaceCheckoutFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
      },
    },
  }

  if (!stripePromise) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
        Zahlungssystem nicht konfiguriert. Bitte kontaktieren Sie den Support.
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutFormInner orderId={orderId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
