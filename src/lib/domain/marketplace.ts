/**
 * Marketplace Domain Logic
 *
 * Business logic for marketplace listings.
 * Handles form-to-API transformation and validation.
 */

import { CreateListingSchema } from '@/lib/schemas/marketplace'
import type { ListingFormData } from '@/types/listing-form'
import { LISTING_STATUS } from '@/config/marketplace'

/**
 * Validate listing form data against the Zod schema (SSOT).
 * Returns the first error message, or null if valid.
 */
export function validateListingForm(formData: ListingFormData): string | null {
  const payload = transformListingFormToPayload(formData)
  const result = CreateListingSchema.safeParse(payload)
  if (result.success) return null

  const firstIssue = result.error.issues[0]
  return firstIssue?.message ?? 'Ungültige Eingabe'
}

/**
 * Transform client-side form data to the API payload shape.
 * Returns a plain object — validated by CreateListingSchema.safeParse in validateListingForm.
 *
 * On EDIT pass `includeStatus: false` — owner status transitions are gated
 * server-side, so a PATCH of a reserved/sold listing must not send `status`.
 */
export function transformListingFormToPayload(
  formData: ListingFormData,
  { includeStatus = true }: { includeStatus?: boolean } = {}
) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    price_chf: parseFloat(formData.price) || 0,
    category: formData.category,
    condition: formData.condition,
    brand: formData.brand.trim() || null,
    model: formData.model.trim() || null,
    images: formData.images,
    delivery_options: formData.deliveryOptions,
    shipping_cost_chf: formData.shippingCost ? parseFloat(formData.shippingCost) : null,
    pickup_location: formData.pickupLocation.trim() || null,
    payment_mode: formData.paymentMode,
    specs: formData.specs.filter(s => s.value.trim()).map(s => ({
      key: s.key,
      value: s.value.trim(),
      unit: s.unit || null,
    })),
    ...(includeStatus ? { status: LISTING_STATUS.ACTIVE } : {}),
    condition_checks: formData.conditionChecks.length > 0
      ? formData.conditionChecks.map(c => ({ key: c.key, checked: c.checked }))
      : undefined,
  }
}
