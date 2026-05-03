'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('components.currencySelector')
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
          <Heading level={3} className="text-sm font-semibold text-neutral-700">{t('selectCurrency')}</Heading>
          <Badge variant="outline" className="text-xs">
            {t('multilingual')}
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
                    <div className="text-xs text-neutral-500">{config.name}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4" />}
                </Button>
              )
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-600">{t('basePrice')}</span>
              <span className="font-medium">
                {formatCurrency(pricing.convertedPrice, selectedCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-600">
                {t('vat', { rate: (getCurrencyConfig(selectedCurrency).taxRate * 100).toFixed(1) })}
              </span>
              <span className="font-medium">
                {formatCurrency(pricing.vat, selectedCurrency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-600">{t('fees')}</span>
              <span className="font-medium">
                {formatCurrency(pricing.total * 0.029 + 0.30, selectedCurrency)}
              </span>
            </div>

            <hr className="border-neutral-300" />

            <div className="flex justify-between items-center font-semibold">
              <span>{t('total')}</span>
              <span className="text-lg">
                {formatCurrency(pricing.total * 1.029 + 0.30, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Currency Notes */}
          <div className="text-xs text-neutral-500 space-y-1">
            {selectedCurrency === 'EUR' && (
              <div className="flex items-start space-x-1">
                <span className="text-info-500">ℹ️</span>
                <span>{t('eurNote')}</span>
              </div>
            )}
            {selectedCurrency === 'CHF' && (
              <div className="flex items-start space-x-1">
                <span className="text-primary-500">🇨🇭</span>
                <span>{t('chfNote')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}