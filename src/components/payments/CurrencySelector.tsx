'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, RefreshCw } from 'lucide-react'
import {
  SupportedCurrency,
  ServicePricing,
  getSupportedCurrencies,
  getCurrencyConfig,
  getServicePricing,
  formatCurrency,
  convertCurrency
} from '@/lib/payments/currency'
import Heading from '@/components/ui/Heading'

interface CurrencySelectorProps {
  baseAmount: number // Amount in CHF (our base currency)
  selectedCurrency: SupportedCurrency
  onCurrencyChange: (currency: SupportedCurrency, pricing: ServicePricing) => void
  businessType?: 'service' | 'product' | 'digital'
  className?: string
}

export default function CurrencySelector({
  baseAmount,
  selectedCurrency,
  onCurrencyChange,
  businessType = 'service',
  className = ''
}: CurrencySelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supportedCurrencies = getSupportedCurrencies()

  const pricing = getServicePricing(baseAmount, selectedCurrency)

  const handleCurrencyChange = async (currency: SupportedCurrency) => {
    setIsLoading(true)

    // Simulate API call for exchange rates (in production, fetch from API)
    await new Promise(resolve => setTimeout(resolve, 300))

    const newPricing = getServicePricing(baseAmount, currency)
    onCurrencyChange(currency, newPricing)

    setIsLoading(false)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level={3} className="text-sm font-semibold text-gray-700">Währung wählen</Heading>
          <Badge variant="outline" className="text-xs">
            Mehrsprachig
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Currency Options */}
          <div className="grid grid-cols-2 gap-2">
            {supportedCurrencies.map((currency) => {
              const config = getCurrencyConfig(currency)
              const isSelected = currency === selectedCurrency

              return (
                <Button
                  key={currency}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCurrencyChange(currency)}
                  disabled={isLoading}
                  className="flex items-center justify-between h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-semibold">{config.symbol} {currency}</div>
                    <div className="text-xs text-gray-500">{config.name}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4" />}
                </Button>
              )
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Basispreis:</span>
              <span className="font-medium">
                {formatCurrency(pricing.convertedPrice, selectedCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                MwSt ({(getCurrencyConfig(selectedCurrency).taxRate * 100).toFixed(1)}%):
              </span>
              <span className="font-medium">
                {formatCurrency(pricing.vat, selectedCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Gebühren (ca.):</span>
              <span className="font-medium">
                {formatCurrency(pricing.total * 0.029 + 0.30, selectedCurrency)}
              </span>
            </div>

            <hr className="border-gray-300" />

            <div className="flex justify-between items-center font-semibold">
              <span>Gesamt:</span>
              <span className="text-lg">
                {formatCurrency(pricing.total * 1.029 + 0.30, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Currency Notes */}
          <div className="text-xs text-gray-500 space-y-1">
            {selectedCurrency === 'EUR' && (
              <div className="flex items-start space-x-1">
                <span className="text-blue-500">ℹ️</span>
                <span>EU-konforme Preise mit 19% MwSt für digitale Dienstleistungen</span>
              </div>
            )}
            {selectedCurrency === 'CHF' && (
              <div className="flex items-start space-x-1">
                <span className="text-green-500">🇨🇭</span>
                <span>Schweizer Preise mit 7.7% MwSt</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}