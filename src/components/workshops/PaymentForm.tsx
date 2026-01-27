'use client'

import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Loader2, CreditCard, Shield } from 'lucide-react'

interface PaymentFormProps {
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function PaymentForm({
  clientSecret,
  onSuccess,
  onError
}: PaymentFormProps) {
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
