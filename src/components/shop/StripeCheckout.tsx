'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react'
import type { StripePaymentIntent } from '@/types/common'

// Initialize Stripe (you'll need to add your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface StripeCheckoutFormProps {
  clientSecret: string
  onSuccess: (paymentIntent: StripePaymentIntent) => void
  onError: (error: string) => void
}

function CheckoutForm({ clientSecret, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

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
        return_url: `${window.location.origin}/shop/checkout/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'Ein Fehler ist aufgetreten.')
      onError(error.message || 'Payment failed')
      setIsLoading(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Zahlung erfolgreich!')
      onSuccess(paymentIntent)
      setIsLoading(false)
    } else {
      setMessage('Unerwarteter Status. Bitte kontaktieren Sie den Support.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">Sichere SSL-verschlüsselte Zahlung</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800">Stripe-zertifiziert</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('erfolgreich')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Jetzt bezahlen
          </>
        )}
      </Button>
    </form>
  )
}

interface StripeCheckoutProps {
  cartId: string
  total: number
  onPaymentSuccess: (paymentIntent: StripePaymentIntent) => void
  onPaymentError: (error: string) => void
}

export default function StripeCheckout({
  cartId,
  total,
  onPaymentSuccess,
  onPaymentError
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    createPaymentIntent()
  }, [cartId, total])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          amount: total,
          currency: 'chf'
        })
      })

      const data = await response.json()

      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        setError(data.error || 'Fehler beim Erstellen der Zahlung')
        onPaymentError(data.error || 'Payment intent creation failed')
      }
    } catch (err) {
      const errorMessage = 'Netzwerkfehler beim Erstellen der Zahlung'
      setError(errorMessage)
      onPaymentError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Zahlung wird vorbereitet...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={createPaymentIntent}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Zahlung konnte nicht initialisiert werden.</p>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a', // green-600
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        clientSecret={clientSecret}
        onSuccess={onPaymentSuccess}
        onError={onPaymentError}
      />
    </Elements>
  )
}