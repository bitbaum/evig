/**
 * Erfassung Types
 *
 * Type definitions for product data entry (Erfassung).
 * Types are derived from Zod schemas in @/lib/schemas/erfassung (SSOT).
 * Utility functions and defaults live here.
 *
 * For configuration constants, see: @/config/erfassung
 */

// =============================================================================
// RE-EXPORT TYPES FROM SCHEMAS (SSOT)
// =============================================================================

export type {
  SpecField,
  VerificationSource,
  AIFieldSource,
  AIFieldMetadata,
  ErfassungFormData,
  VoiceProductData,
  ErfassungPayload,
  BulkProductStatus,
  BulkProductSource,
  BulkProduct,
  BulkSaveRequest,
  BulkSaveResponse,
  ErfassungAction,
} from '@/lib/schemas/erfassung'

// Re-export schemas for validation use
export {
  specFieldSchema,
  verificationSourceSchema,
  aiFieldSourceSchema,
  erfassungFormDataSchema,
  voiceProductDataSchema,
  erfassungPayloadSchema,
  bulkProductSchema,
  bulkSaveRequestSchema,
  bulkSaveResponseSchema,
} from '@/lib/schemas/erfassung'

// Import types needed for utility functions
import type {
  ErfassungFormData,
  BulkProductSource,
  BulkProduct,
  AIFieldMetadata,
  ErfassungPayload,
} from '@/lib/schemas/erfassung'

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Default form state
 */
export const DEFAULT_FORM_DATA: ErfassungFormData = {
  hersteller: '',
  produktname: '',
  kurzbeschreibung: '',
  specs: [{ key: '', value: '' }],
  laenge_mm: '',
  breite_mm: '',
  hoehe_mm: '',
  gewicht_kg: '',
  verkaufspreis: '',
  zustand: 'good',
  location: '',
  box_id: '',
  auf_lager: '1',
  hauptkategorie: '',
  unterkategorie: '',
  kundenprofile: [],
  image: null,
}

/**
 * Create a default BulkProduct from a source type
 */
export function createDefaultBulkProduct(
  source: BulkProductSource,
  tempId?: string,
): BulkProduct {
  return {
    ...DEFAULT_FORM_DATA,
    _tempId: tempId || `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    _source: source,
    _status: 'warning',
    _errors: [],
    _selected: true,
  }
}

/**
 * Convert form data to a BulkProduct
 */
export function formDataToBulkProduct(
  data: Partial<ErfassungFormData>,
  source: BulkProductSource,
  metadata?: AIFieldMetadata,
): BulkProduct {
  return {
    ...DEFAULT_FORM_DATA,
    ...data,
    _tempId: `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    _source: source,
    _status: data.hersteller && data.produktname ? 'valid' : 'warning',
    _errors: [],
    _selected: true,
    _aiMetadata: metadata,
  }
}

/**
 * Convert ErfassungFormData to ErfassungPayload for API submission.
 * SSOT: Used by both single-mode submit and bulk-mode save.
 */
export function formDataToPayload(
  data: ErfassungFormData,
  action: 'draft' | 'erfassen' | 'publish',
): ErfassungPayload {
  const specifications: Record<string, string> = {}
  data.specs.forEach(spec => {
    if (spec.key && spec.value) {
      specifications[spec.key] = spec.value
    }
  })

  return {
    hersteller: data.hersteller,
    produktname: data.produktname,
    kurzbeschreibung: data.kurzbeschreibung,
    langtext: JSON.stringify(specifications),
    verkaufspreis: parseFloat(data.verkaufspreis) || 0,
    zustand: data.zustand,
    laenge_mm: parseInt(data.laenge_mm) || null,
    breite_mm: parseInt(data.breite_mm) || null,
    hoehe_mm: parseInt(data.hoehe_mm) || null,
    gewicht_kg: parseFloat(data.gewicht_kg) || null,
    location: data.location,
    box_id: data.box_id,
    auf_lager: parseInt(data.auf_lager) || 1,
    hauptkategorie: data.hauptkategorie,
    unterkategorie: data.unterkategorie,
    kundenprofile: data.kundenprofile,
    image: data.image,
    action,
  }
}
