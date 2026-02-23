export interface RepairerApplicationForm {
  businessType: 'individual' | 'business' | 'freelance'
  businessName: string
  description: string
  yearsExperience: string
  phone: string
  website: string
  address: string
  city: string
  postalCode: string
  serviceRadius: string
  remoteServices: boolean
  hourlyRate: string
  emergencyFee: string
  homeVisitFee: string
  servicesOffered: string[]
  specializations: string[]
  certifications: string[]
  insuranceInfo: string
  portfolioImages: File[]
  idDocument: File | null
  certificationsDocs: File[]
  termsAccepted: boolean
}

export interface CheckboxOption {
  id: string
  label: string
}

export type FormUpdater = React.Dispatch<React.SetStateAction<RepairerApplicationForm>>
