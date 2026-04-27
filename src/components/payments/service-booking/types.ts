/**
 * Types for Service Booking Payment
 */

import type { SupportedCurrency, ServicePricing } from '@/lib/payments/currency'
import type { URGENCY } from '@/config/it-hilfe'

export type BookingStep = 'details' | 'payment' | 'processing' | 'success' | 'error'

export type UrgencyLevel = typeof URGENCY[keyof typeof URGENCY]

// API response pricing structure
export interface ApiPricingResponse {
  currency: string
  subtotal: number
  vat: number
  vatRate: string
  providerFee: number
  total: number
}

// Local display pricing structure
export interface DisplayPricing {
  subtotal: number
  vat: number
  total: number
}

export interface PaymentSuccessResult {
  appointmentId: string
  invoiceId: string
  paymentIntentId?: string
  invoiceNumber?: string
}

export interface BookingData {
  description: string
  urgency: UrgencyLevel
  deviceInfo: string
  useEscrow: boolean
  preferredDate: string
  preferredTimeSlots: string[]
}

export interface PaymentData {
  paymentUrl: string
  amount: number
  appointmentId: string
  invoiceId: string
  invoiceNumber: string
  pricing: ApiPricingResponse
}

export interface ServiceInfo {
  id: string
  slug: string
  name: string
  price_cents: number
  requires_approval: boolean
}

export interface ServiceBookingPaymentProps {
  service: ServiceInfo
  onSuccess?: (result: PaymentSuccessResult) => void
  onError?: (error: string) => void
}

// Re-export for convenience
export type { SupportedCurrency, ServicePricing }
