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
import CurrencySelector from '../CurrencySelector'
import type { ServiceInfo, BookingData, DisplayPricing, SupportedCurrency, ServicePricing } from './types'

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
  const servicePrice = service.price_cents / 100
  const totalWithFees = currentPricing.total + calculatePaymentFees(currentPricing.total)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Service buchen: {service.name}</CardTitle>
        <CardDescription>
          Buchen Sie diesen Service mit sofortiger Zahlung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Details */}
        <ServiceDetailsCard
          service={service}
          selectedCurrency={selectedCurrency}
          currentPricing={currentPricing}
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
          />

          <UrgencyField
            value={bookingData.urgency}
            onChange={(value) => onBookingDataChange(prev => ({ ...prev, urgency: value }))}
          />

          <DeviceInfoField
            value={bookingData.deviceInfo}
            onChange={(value) => onBookingDataChange(prev => ({ ...prev, deviceInfo: value }))}
          />

          <EscrowToggle
            checked={bookingData.useEscrow}
            onChange={(checked) => onBookingDataChange(prev => ({ ...prev, useEscrow: checked }))}
          />
        </div>

        {bookingData.useEscrow && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Mit Escrow-Schutz sind Ihre Zahlungsmittel sicher. Sie werden automatisch
              freigegeben, sobald der Service erfolgreich abgeschlossen wurde.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onSubmit}
          className="w-full py-3"
          disabled={!bookingData.description.trim()}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Buchung erstellen und bezahlen ({selectedCurrency} {totalWithFees.toFixed(2)})
        </Button>
      </CardContent>
    </Card>
  )
}

function ServiceDetailsCard({
  service,
  selectedCurrency,
  currentPricing,
}: {
  service: ServiceInfo
  selectedCurrency: SupportedCurrency
  currentPricing: DisplayPricing
}) {
  const vatRate = getVATRateLabel(selectedCurrency)
  const estimatedFees = calculatePaymentFees(currentPricing.total)
  const totalWithFees = currentPricing.total + estimatedFees

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-2">Service-Details</h3>
      <div className="space-y-2 text-sm text-blue-700">
        <p><strong>Service:</strong> {service.name}</p>
        <p><strong>Preis:</strong> {selectedCurrency} {currentPricing.subtotal.toFixed(2)}</p>
        <p><strong>MwSt ({vatRate}%):</strong> {selectedCurrency} {currentPricing.vat.toFixed(2)}</p>
        <p><strong>Gebühren:</strong> {selectedCurrency} {estimatedFees.toFixed(2)} (ca.)</p>
        <p><strong>Gesamt:</strong> {selectedCurrency} {totalWithFees.toFixed(2)}</p>
        {service.requires_approval && (
          <div className="flex items-center mt-2">
            <Badge variant="secondary">Genehmigung erforderlich</Badge>
          </div>
        )}
      </div>
    </div>
  )
}

function DescriptionField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor="booking-description" className="block text-sm font-medium mb-2">
        Beschreibung Ihres Problems *
      </label>
      <textarea
        id="booking-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Beschreiben Sie das Problem so detailliert wie möglich..."
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
}: {
  value: string
  onChange: (value: 'low' | 'normal' | 'high' | 'urgent') => void
}) {
  return (
    <div>
      <label htmlFor="booking-urgency" className="block text-sm font-medium mb-2">
        Dringlichkeit
      </label>
      <select
        id="booking-urgency"
        value={value}
        onChange={(e) => onChange(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
        className="w-full p-3 border rounded-lg"
      >
        <option value="low">Niedrig - Innerhalb 2 Wochen</option>
        <option value="normal">Normal - Innerhalb 1 Woche</option>
        <option value="high">Hoch - Innerhalb 3 Tagen</option>
        <option value="urgent">Dringend - Heute oder morgen</option>
      </select>
    </div>
  )
}

function DeviceInfoField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor="booking-device-info" className="block text-sm font-medium mb-2">
        Geräte-Informationen (optional)
      </label>
      <input
        id="booking-device-info"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="z.B. MacBook Pro 2021, iPhone 13, etc."
        className="w-full p-3 border rounded-lg"
      />
    </div>
  )
}

function EscrowToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
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
        <strong>Escrow-Schutz aktivieren</strong> - Geld wird erst freigegeben, wenn Service abgeschlossen ist
      </label>
    </div>
  )
}
