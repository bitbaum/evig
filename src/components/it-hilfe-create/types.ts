/**
 * IT-Hilfe Create Form Types
 * Shared between page component and domain layer.
 */

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
}

export const INITIAL_IT_HILFE_FORM: ITHilfeCreateFormData = {
  categoryId: '',
  deviceBrand: '',
  deviceModel: '',
  title: '',
  description: '',
  urgency: 'normal',
  maxBudget: '',
  postalCode: '',
  city: '',
  canton: '',
  serviceType: 'flexible',
  skillsNeeded: [],
  imageUrls: [],
  aiDiagnosis: '',
}
