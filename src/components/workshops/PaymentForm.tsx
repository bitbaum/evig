'use client'

import { useState } from 'react'
import { Loader2, CreditCard, Shield, ExternalLink } from 'lucide-react'

interface PaymentFormProps {
  paymentUrl: string
  amount: string
  currency?: string
}

export function PaymentForm({
  paymentUrl,
  amount,
  currency = 'CHF'
}: PaymentFormProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handlePay = () => {
    setIsRedirecting(true)
    window.location.href = paymentUrl
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
        <Shield className="w-4 h-4 text-blue-600 mr-2" />
        <span className="text-sm text-blue-800">Sichere SSL-verschlüsselte Zahlung</span>
      </div>

      <button
        onClick={handlePay}
        disabled={isRedirecting}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Weiterleitung zum Zahlungsanbieter...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Jetzt bezahlen — {currency} {amount}
            <ExternalLink className="w-3 h-3 ml-2" />
          </>
        )}
      </button>
    </div>
  )
}
