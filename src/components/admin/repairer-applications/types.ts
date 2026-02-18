import type { ApprovalStatus } from '@/config/approval-status'

export interface CertificationItem {
  name?: string
  type?: string
  issuer?: string
}

export interface RepairerApplication {
  id: string
  userId: string
  applicantName: string
  applicantEmail: string
  userCreatedAt: string
  businessName: string | null
  businessType: string
  description: string
  yearsExperience: number
  phone: string
  website: string | null
  address: string
  city: string
  postalCode: string
  serviceRadiusKm: number
  remoteServices: boolean
  hourlyRateCents: number | null
  emergencyFeeCents: number | null
  homeVisitFeeCents: number | null
  servicesOffered: string[]
  specializations: string[]
  certifications: (CertificationItem | string)[]
  insuranceInfo: string | null
  portfolioImages: string[]
  verificationDocuments: string[]
  termsAccepted: boolean
  status: string
  documentVerificationStatus: string
  adminNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  documents?: VerificationDocument[]
  missingRequiredDocuments?: DocumentType[]
}

export type ApplicationStatus = ApprovalStatus

export interface VerificationDocument {
  id: string
  applicationId: string
  documentTypeId: string | null
  documentTypeName: string | null
  documentTypeDescription: string | null
  isRequired: boolean
  filename: string
  originalFilename: string
  filePath: string
  fileSizeBytes: number | null
  mimeType: string | null
  status: string
  adminNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentType {
  id: string
  slug: string
  name: string
  description: string
  maxFileSizeMb: number
  allowedExtensions: string[]
}

export interface VerificationResult {
  verified: boolean
  verifiedAt?: string
  notes?: string
  method?: string
}

export interface Certification {
  id: string
  applicationId: string
  certificationTypeId: string | null
  certificationTypeName: string | null
  certificationTypeDescription: string | null
  category: string | null
  customName: string | null
  issuingAuthority: string | null
  certificationNumber: string | null
  issueDate: string | null
  expiryDate: string | null
  verificationStatus: string
  verificationMethod: string
  verificationResult: VerificationResult | null
  adminNotes: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  documentPath: string | null
  createdAt: string
  updatedAt: string
  isExpired: boolean
  daysUntilExpiry: number | null
}

export type ActionDialogType = 'approve_app' | 'reject_app' | 'request_changes' | 'approve_doc' | 'reject_doc' | 'verify_cert' | 'reject_cert'

export interface ActionDialogState {
  type: ActionDialogType
  targetId: string
  reason: string
  notes: string
  expiresAt: string
}
