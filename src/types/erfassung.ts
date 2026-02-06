/**
 * Erfassung Types
 *
 * Type definitions for product data entry (Erfassung).
 * Used by: erfassung page, voice API, voice component
 *
 * For configuration constants, see: @/config/erfassung
 */

/**
 * Spec field for technical specifications
 */
export interface SpecField {
  key: string
  value: string
}

/**
 * Verification source link for AI-extracted data
 */
export interface VerificationSource {
  title: string // Display title (e.g., "Apple Official Specs")
  url: string // Clickable URL
  type: 'manufacturer' | 'marketplace' | 'review' | 'specs' | 'price'
  relevance: number // 0-1 how relevant this source is
}

/**
 * AI extraction source information
 */
export interface AIFieldSource {
  type: 'voice' | 'text' | 'image' | 'database'
  inputText?: string // Original input that led to this extraction
  confidence: number // 0-1 confidence score
  model?: string // AI model used (e.g., 'llama3.2')
  timestamp: number // When the extraction happened
  sources?: VerificationSource[] // Verification links for this field
}

/**
 * Metadata for AI-filled fields
 * Maps field names to their extraction source info
 */
export type AIFieldMetadata = {
  [K in keyof ErfassungFormData]?: AIFieldSource
}

/**
 * Full form data for product entry
 */
export interface ErfassungFormData {
  // Basic info
  hersteller: string
  produktname: string
  kurzbeschreibung: string

  // Technical specs (dynamic)
  specs: SpecField[]

  // Physical dimensions
  laenge_mm: string
  breite_mm: string
  hoehe_mm: string
  gewicht_kg: string

  // Inventory
  verkaufspreis: string
  zustand: string
  location: string
  box_id: string
  auf_lager: string

  // Category
  hauptkategorie: string
  unterkategorie: string

  // Customer profiles
  kundenprofile: string[]

  // Image (base64 or URL)
  image: string | null
}

/**
 * Voice input result - subset of form data
 */
export interface VoiceProductData {
  hersteller: string
  produktname: string
  kurzbeschreibung: string
  specs: SpecField[]
  verkaufspreis: string
  zustand: string
  hauptkategorie: string
  unterkategorie: string
  kundenprofile: string[]
  bemerkungen?: string
}

// =============================================================================
// API PAYLOAD TYPES (shared between single and bulk save)
// =============================================================================

/**
 * Payload for creating a product via the erfassung API
 * SSOT: Used by both single route.ts and bulk-save route.ts
 */
export interface ErfassungPayload {
  hersteller: string
  produktname: string
  kurzbeschreibung?: string
  langtext?: string
  verkaufspreis: number
  zustand: string
  laenge_mm?: number | null
  breite_mm?: number | null
  hoehe_mm?: number | null
  gewicht_kg?: number | null
  location?: string
  box_id?: string
  auf_lager?: number
  hauptkategorie?: string
  unterkategorie?: string
  kundenprofile?: string[]
  image?: string | null
  // Action determines the product state:
  // - 'draft': pending_review, not in shop
  // - 'erfassen': approved, not in shop
  // - 'publish': approved, in shop
  action?: 'draft' | 'erfassen' | 'publish'
  publish?: boolean // Legacy support
}

// =============================================================================
// BULK ERFASSUNG TYPES
// =============================================================================

export type BulkProductStatus = 'valid' | 'warning' | 'error' | 'processing' | 'saved'
export type BulkProductSource = 'text' | 'csv' | 'voice' | 'image' | 'manual'

/**
 * A product in the bulk review table.
 * Extends ErfassungFormData with bulk-specific metadata.
 */
export interface BulkProduct extends ErfassungFormData {
  _tempId: string
  _source: BulkProductSource
  _status: BulkProductStatus
  _errors: string[]
  _selected: boolean
  _saveResult?: { success: boolean; productId?: string; itemUUID?: string; error?: string }
  _aiMetadata?: AIFieldMetadata
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
 * Request body for bulk save API
 */
export interface BulkSaveRequest {
  products: ErfassungPayload[]
  action: 'draft' | 'erfassen' | 'publish'
}

/**
 * Response from bulk save API
 */
export interface BulkSaveResponse {
  total: number
  succeeded: number
  failed: number
  results: Array<{
    index: number
    success: boolean
    productId?: string
    itemUUID?: string
    error?: string
  }>
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
