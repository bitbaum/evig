/**
 * IT-Hilfe Domain Layer
 * Business logic for IT help requests — no HTTP, no UI.
 */

import { itHilfeRequestSchema } from '@/lib/validation/schemas'
import type { ITHilfeCreateFormData } from '@/components/it-hilfe-create/types'

/**
 * Transform client form data to API payload shape.
 */
export function transformITHilfeFormToPayload(formData: ITHilfeCreateFormData) {
  return {
    categoryId: formData.categoryId,
    deviceBrand: formData.deviceBrand || null,
    deviceModel: formData.deviceModel || null,
    title: formData.title,
    description: formData.description,
    urgency: formData.urgency,
    maxBudgetCents: formData.maxBudget ? Math.round(parseFloat(formData.maxBudget) * 100) : null,
    postalCode: formData.postalCode,
    city: formData.city,
    canton: formData.canton,
    serviceType: formData.serviceType,
    skillsNeeded: formData.skillsNeeded,
    imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : undefined,
    aiDiagnosis: formData.aiDiagnosis || null,
  }
}

/**
 * Validate IT-Hilfe form data using the Zod schema (SSOT).
 * Returns the first error message, or null if valid.
 */
export function validateITHilfeForm(formData: ITHilfeCreateFormData): string | null {
  const payload = transformITHilfeFormToPayload(formData)
  const result = itHilfeRequestSchema.safeParse(payload)
  if (result.success) return null
  const firstIssue = result.error.issues[0]
  return firstIssue?.message ?? 'Ungültige Eingabe'
}
