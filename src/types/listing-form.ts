/**
 * Marketplace Listing Form Data Types
 *
 * Shared between UI components and domain layer.
 * Lives in types/ to avoid circular dependency (domain ↔ components).
 */

import type { Dispatch, SetStateAction } from 'react'

export interface SpecFieldData {
  key: string
  value: string
  unit?: string
}

export interface ConditionCheckData {
  key: string
  label: string
  checked: boolean
}

export interface ListingFormData {
  title: string
  description: string
  price: string
  category: string
  condition: string
  brand: string
  model: string
  images: string[]
  deliveryOptions: string
  shippingCost: string
  pickupLocation: string
  paymentMode: string
  specs: SpecFieldData[]
  conditionChecks: ConditionCheckData[]
}

export type ListingFormUpdater = Dispatch<SetStateAction<ListingFormData>>

export const INITIAL_LISTING_FORM: ListingFormData = {
  title: '',
  description: '',
  price: '',
  category: '',
  condition: 'good',
  brand: '',
  model: '',
  images: [],
  deliveryOptions: 'pickup',
  shippingCost: '',
  pickupLocation: '',
  paymentMode: 'both',
  specs: [],
  conditionChecks: [],
}
