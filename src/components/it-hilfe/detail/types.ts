export interface ITHilfeRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterEmail?: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  title: string
  description: string
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  status: string
  matchedOfferId: string | null
  offerCount: number
  aiDiagnosis: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  isOwner: boolean
}

export interface OfferRepairerProfile {
  id: string
  businessName: string | null
  isVerified: boolean | null
  averageRating: string | null
  totalReviews: number | null
}

export interface Offer {
  id: string
  requestId: string
  helperId: string
  helperName: string
  helperEmail: string
  message: string
  estimatedTime: string | null
  proposedCompensation: string | null
  relevantSkills: string[]
  status: string
  createdAt: string
  repairerProfile?: OfferRepairerProfile | null
}
