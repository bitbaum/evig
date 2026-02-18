import type { DonationType, DonationStatus } from '@/config/donations'

export interface Donation {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  donation_type: DonationType
  // Monetary
  amount_cents: number | null
  currency: string
  payment_method: string | null
  // Device
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  estimated_value_cents: number | null
  // Anonymous
  donor_name: string | null
  donor_email: string | null
  // Status
  status: string
  recorded_by_name: string | null
  receipt_requested: boolean
  receipt_sent: boolean
  thank_you_sent: boolean
  notes: string | null
  // Timestamps
  created_at: string
}

export interface DonationStats {
  total: number
  monetary: number
  device: number
  pendingThanks: number
  pendingReceipts: number
  totalValueCents: number
}

export interface DonationFormData {
  // Monetary
  amount_chf: string
  payment_method: string
  // Device
  device_category: string
  device_brand: string
  device_model: string
  device_description: string
  device_condition: string
  estimated_value_chf: string
  // Common
  donor_name: string
  donor_email: string
  receipt_requested: boolean
  notes: string
}

export interface DonationFiltersState {
  donation_type: DonationType | 'all'
  status: DonationStatus | 'all'
}

export interface UserResult {
  id: string
  name: string | null
  email: string
}

export const DEFAULT_FORM_DATA: DonationFormData = {
  amount_chf: '',
  payment_method: '',
  device_category: '',
  device_brand: '',
  device_model: '',
  device_description: '',
  device_condition: '',
  estimated_value_chf: '',
  donor_name: '',
  donor_email: '',
  receipt_requested: false,
  notes: '',
}
