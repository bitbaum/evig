/**
 * Common Type Definitions
 * 
 * Shared type definitions used across the application
 * 
 * Created: 2026-01-30
 * Last Modified: 2026-01-30
 * Last Modified Summary: Initial creation for Dev Guide compliance
 */

import type { PaymentIntent } from '@stripe/stripe-js'

/**
 * Stripe Payment Intent type
 */
export type StripePaymentIntent = PaymentIntent

/**
 * Medusa Cart Item type
 */
export interface MedusaCartItem {
  id: string
  title: string
  description?: string
  thumbnail?: string
  unit_price: number
  quantity: number
  variant_id?: string
  product_id?: string
}

/**
 * Database query parameter types
 */
export type QueryParams = unknown[]

/**
 * Social links record type
 */
export interface SocialLinks {
  [platform: string]: string
}

/**
 * Availability record type
 */
export interface Availability {
  [day: string]: {
    available: boolean
    hours?: string
  }
}

/**
 * Purchase history item type
 */
export interface PurchaseHistoryItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price_cents: number
  purchased_at: Date
}

/**
 * Customer preference value type
 */
export type PreferenceValue = string | number | boolean | null | Record<string, unknown> | unknown[]

/**
 * Customer segment criteria type
 */
export interface SegmentCriteria {
  [key: string]: unknown
}
