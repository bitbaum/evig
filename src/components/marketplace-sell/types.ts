import type { Dispatch, SetStateAction } from 'react'

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
}

export type ListingFormUpdater = Dispatch<SetStateAction<ListingFormData>>

export const INITIAL_LISTING_FORM: ListingFormData = {
  title: '',
  description: '',
  price: '',
  category: '',
  condition: '',
  brand: '',
  model: '',
  images: [],
  deliveryOptions: 'pickup',
  shippingCost: '',
  pickupLocation: '',
  paymentMode: 'direct',
}
