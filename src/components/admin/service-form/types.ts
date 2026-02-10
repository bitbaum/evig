export interface Feature {
  title: string
  description: string
  icon: string
}

export interface ProcessStep {
  step: number
  title: string
  description: string
}

export interface ServiceFormData {
  id?: string
  name: string
  slug: string
  description: string
  category: string
  durationMinutes: number
  priceCents: number | null
  requiresApproval: boolean
  isActive: boolean
  isBookable: boolean
  isFeatured: boolean
  displayOrder: number
  iconName: string
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  features: Feature[]
  process: ProcessStep[]
  pricingBase: string
  pricingDetails: string[]
  pricingMediaPrices: string[] | null
}
