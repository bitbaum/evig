'use client'

/**
 * Booking form for service details
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculatePaymentFees, getVATRateLabel } from '@/lib/pricing'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import CurrencySelector from '../CurrencySelector'
import Heading from '@/components/ui/Heading'
import type { ServiceInfo, BookingData, DisplayPricing, SupportedCurrency, ServicePricing, UrgencyLevel } from './types'

interface BookingFormProps {
  service: ServiceInfo
  bookingData: BookingData
  selectedCurrency: SupportedCurrency
  currentPricing: DisplayPricing
  onBookingDataChange: React.Dispatch<React.SetStateAction<BookingData>>
  onCurrencyChange: (currency: SupportedCurrency, pricing: ServicePricing) => void
  onSubmit: () => void
}

export function BookingForm({
  service,
  bookingData,
  selectedCurrency,
  currentPricing,
  onBookingDataChange,
  onCurrencyChange,
  onSubmit,
}: BookingFormProps) {
  const t = useTranslations('services.payment')
  const servicePrice = service.price_cents / 100
  const totalWithFees = currentPricing.total + calculatePaymentFees(currentPricing.total)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title', { name: service.name })}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Details */}
        <ServiceDetailsCard
          service={service}
          selectedCurrency={selectedCurrency}
          currentPricing={currentPricing}
          t={t}
        />

        {/* Currency Selector */}
        <CurrencySelector
          baseAmount={servicePrice}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
          businessType="service"
        />

        {/* Booking Form Fields */}
        <div className="space-y-4">
          <DescriptionField
            value={bookingData.description}
            onChange={(value) => onBookingDataChange(prev => ({ ...prev, description: value }))}
            t={t}
          />

          <UrgencyField
            value={bookingData.urgency}
            onChange={(value) => onBookingDataChange(prev => ({ ...prev, urgency: value }))}
            t={t}
          />

          <DeviceInfoField
            value={bookingData.deviceInfo}
            onChange={(value) => onBookingDataChange(prev => ({ ...prev, deviceInfo: value }))}
            t={t}
          />

          <EscrowToggle
            checked={bookingData.useEscrow}
            onChange={(checked) => onBookingDataChange(prev => ({ ...prev, useEscrow: checked }))}
            t={t}
          />
        </div>

        {bookingData.useEscrow && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('escrowAlert')}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onSubmit}
          className="w-full py-3"
          disabled={!bookingData.description.trim()}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          {t('submitButton', { currency: selectedCurrency, amount: totalWithFees.toFixed(2) })}
        </Button>
      </CardContent>
    </Card>
  )
}

type TFn = ReturnType<typeof useTranslations>

function ServiceDetailsCard({
  service,
  selectedCurrency,
  currentPricing,
  t,
}: {
  service: ServiceInfo
  selectedCurrency: SupportedCurrency
  currentPricing: DisplayPricing
  t: TFn
}) {
  const vatRate = getVATRateLabel(selectedCurrency)
  const estimatedFees = calculatePaymentFees(currentPricing.total)
  const totalWithFees = currentPricing.total + estimatedFees

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <Heading level={3} className="font-semibold text-blue-800 mb-2">{t('detailsHeading')}</Heading>
      <div className="space-y-2 text-sm text-blue-700">
        <p><strong>{t('detailService')}</strong> {service.name}</p>
        <p><strong>{t('detailPrice')}</strong> {selectedCurrency} {currentPricing.subtotal.toFixed(2)}</p>
        <p><strong>{t('detailVat', { vatRate })}</strong> {selectedCurrency} {currentPricing.vat.toFixed(2)}</p>
        <p><strong>{t('detailFees')}</strong> {selectedCurrency} {estimatedFees.toFixed(2)} (ca.)</p>
        <p><strong>{t('detailTotal')}</strong> {selectedCurrency} {totalWithFees.toFixed(2)}</p>
        {service.requires_approval && (
          <div className="flex items-center mt-2">
            <Badge variant="secondary">{t('requiresApproval')}</Badge>
          </div>
        )}
      </div>
    </div>
  )
}

function DescriptionField({
  value,
  onChange,
  t,
}: {
  value: string
  onChange: (value: string) => void
  t: TFn
}) {
  return (
    <div>
      <label htmlFor="booking-description" className="block text-sm font-medium mb-2">
        {t('descriptionLabel')}
      </label>
      <textarea
        id="booking-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('descriptionPlaceholder')}
        className="w-full p-3 border rounded-lg"
        rows={4}
        required
      />
    </div>
  )
}

function UrgencyField({
  value,
  onChange,
  t,
}: {
  value: string
  onChange: (value: UrgencyLevel) => void
  t: TFn
}) {
  return (
    <div>
      <label htmlFor="booking-urgency" className="block text-sm font-medium mb-2">
        {t('urgencyLabel')}
      </label>
      <select
        id="booking-urgency"
        value={value}
        onChange={(e) => onChange(e.target.value as UrgencyLevel)}
        className="w-full p-3 border rounded-lg"
      >
        <option value="low">{t('urgencyLow')}</option>
        <option value="normal">{t('urgencyNormal')}</option>
        <option value="high">{t('urgencyHigh')}</option>
        <option value="urgent">{t('urgencyUrgent')}</option>
      </select>
    </div>
  )
}

function DeviceInfoField({
  value,
  onChange,
  t,
}: {
  value: string
  onChange: (value: string) => void
  t: TFn
}) {
  return (
    <div>
      <label htmlFor="booking-device-info" className="block text-sm font-medium mb-2">
        {t('deviceInfoLabel')}
      </label>
      <input
        id="booking-device-info"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('deviceInfoPlaceholder')}
        className="w-full p-3 border rounded-lg"
      />
    </div>
  )
}

function EscrowToggle({
  checked,
  onChange,
  t,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  t: TFn
}) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="escrow"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      <label htmlFor="escrow" className="text-sm">
        <strong>{t('escrowCheckLabel')}</strong> - {t('escrowCheckDescription')}
      </label>
    </div>
  )
}
