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
  preferredTechnicianId: string | null
  preferredTechnicianName: string | null
  preferredTechnicianCity: string | null
  matchedHelperId: string | null
  /**
   * Display name of the matched helper. Available to anyone viewing the
   * request (it's already shown on the offer card before acceptance).
   */
  matchedHelperName: string | null
  /**
   * Phone number of the matched helper. ONLY returned to the request
   * owner once an offer is accepted (status === 'matched'). Surfaced so
   * the requester can coordinate logistics beyond async messaging — see
   * PPP.2 audit gap.
   */
  matchedHelperPhone: string | null
  offerCount: number
  aiDiagnosis: string | null
  completedAt: string | null
  completedBy: string | null
  reviewedAt: string | null
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
