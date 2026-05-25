/**
 * IT-Hilfe Form Data Types
 *
 * Shared between UI components and domain layer.
 * Lives in types/ to avoid circular dependency (domain ↔ components).
 */

import { URGENCY_DEFAULT } from '@/config/it-hilfe'

export interface ITHilfeCreateFormData {
  categoryId: string
  deviceBrand: string
  deviceModel: string
  title: string
  description: string
  urgency: string
  maxBudget: string
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  aiDiagnosis: string
  // For anonymous (logged-out) submissions: the user supplies their email
  // and the backend provisions an account + sends a claim link. Empty
  // when the user is already authenticated.
  submitterEmail: string
}

export const INITIAL_IT_HILFE_FORM: ITHilfeCreateFormData = {
  categoryId: '',
  deviceBrand: '',
  deviceModel: '',
  title: '',
  description: '',
  urgency: URGENCY_DEFAULT,
  maxBudget: '',
  postalCode: '',
  city: '',
  canton: '',
  serviceType: 'flexible',
  skillsNeeded: [],
  imageUrls: [],
  aiDiagnosis: '',
  submitterEmail: '',
}
