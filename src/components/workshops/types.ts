/**
 * Workshop registration form types
 *
 * Shared types for workshop registration components.
 */

export interface Workshop {
  id: string
  slug: string
  title: string
  max_participants: number
  price_cents: number
}

export interface WorkshopInstance {
  id: string
  start_date: string
  location: string
  status: string
  current_participants: number
}

export interface WorkshopInstanceDetails {
  start_date: string
  location: string
  workshop_title: string
  workshop_slug: string
}

export interface RegistrationData {
  id: string
  status: string
  registered_at: string
  workshop_instance?: WorkshopInstanceDetails
}

export interface PaymentData {
  registrationId: string
  clientSecret: string
  amount: string
  invoiceNumber: string
}

export type RegistrationStatus =
  | 'checking'
  | 'not-registered'
  | 'registered'
  | 'registering'
  | 'payment'
  | 'processing'
  | 'success'
  | 'error'
