/**
 * Erfassung Zod Schemas
 *
 * Validation schemas for product data entry (Erfassung).
 * Types are derived from these schemas (SSOT).
 *
 * For configuration constants, see: @/config/erfassung
 */

import { z } from 'zod';

// =============================================================================
// FIELD SCHEMAS (reusable building blocks)
// =============================================================================

export const specFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
  placeholder: z.string().optional(),
});

const verificationSourceTypeSchema = z.enum([
  'manufacturer',
  'marketplace',
  'review',
  'specs',
  'price',
]);

export const verificationSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: verificationSourceTypeSchema,
  relevance: z.number().min(0).max(1),
});

const aiFieldSourceTypeSchema = z.enum(['voice', 'text', 'image', 'database']);

export const aiFieldSourceSchema = z.object({
  type: aiFieldSourceTypeSchema,
  inputText: z.string().optional(),
  confidence: z.number().min(0).max(1),
  model: z.string().optional(),
  timestamp: z.number(),
  sources: z.array(verificationSourceSchema).optional(),
});

// =============================================================================
// FORM DATA SCHEMA
// =============================================================================

export const erfassungFormDataSchema = z.object({
  // Basic info
  hersteller: z.string(),
  produktname: z.string(),
  kurzbeschreibung: z.string(),

  // Technical specs (dynamic)
  specs: z.array(specFieldSchema),

  // Physical dimensions
  laenge_mm: z.string(),
  breite_mm: z.string(),
  hoehe_mm: z.string(),
  gewicht_kg: z.string(),

  // Inventory
  verkaufspreis: z.string(),
  zustand: z.string(),
  location: z.string(),
  box_id: z.string(),
  auf_lager: z.string(),

  // Category
  hauptkategorie: z.string(),
  unterkategorie: z.string(),

  // Customer profiles
  kundenprofile: z.array(z.string()),

  // Image (base64 or URL)
  image: z.string().nullable(),
});

// =============================================================================
// VOICE INPUT SCHEMA
// =============================================================================

export const voiceProductDataSchema = z.object({
  hersteller: z.string(),
  produktname: z.string(),
  kurzbeschreibung: z.string(),
  specs: z.array(specFieldSchema),
  verkaufspreis: z.string(),
  zustand: z.string(),
  hauptkategorie: z.string(),
  unterkategorie: z.string(),
  kundenprofile: z.array(z.string()),
  bemerkungen: z.string().optional(),
});

// =============================================================================
// API PAYLOAD SCHEMAS
// =============================================================================

const erfassungActionSchema = z.enum(['draft', 'erfassen', 'publish']);

export const erfassungPayloadSchema = z.object({
  hersteller: z.string().min(1, 'Hersteller erforderlich'),
  produktname: z.string().min(1, 'Produktname erforderlich'),
  kurzbeschreibung: z.string().optional(),
  langtext: z.string().optional(),
  verkaufspreis: z.number().min(0, 'Preis muss positiv sein'),
  zustand: z.string().min(1, 'Zustand erforderlich'),
  laenge_mm: z.number().nullable().optional(),
  breite_mm: z.number().nullable().optional(),
  hoehe_mm: z.number().nullable().optional(),
  gewicht_kg: z.number().nullable().optional(),
  location: z.string().optional(),
  box_id: z.string().optional(),
  auf_lager: z.number().int().min(0).optional(),
  hauptkategorie: z.string().optional(),
  unterkategorie: z.string().optional(),
  kundenprofile: z.array(z.string()).optional(),
  image: z.string().nullable().optional(),
  action: erfassungActionSchema.optional(),
  publish: z.boolean().optional(),
});

// =============================================================================
// BULK SCHEMAS
// =============================================================================

const bulkProductStatusSchema = z.enum([
  'valid',
  'warning',
  'error',
  'processing',
  'saved',
]);

const bulkProductSourceSchema = z.enum([
  'text',
  'csv',
  'voice',
  'image',
  'manual',
]);

export const bulkProductSchema = erfassungFormDataSchema.extend({
  _tempId: z.string(),
  _source: bulkProductSourceSchema,
  _status: bulkProductStatusSchema,
  _errors: z.array(z.string()),
  _selected: z.boolean(),
  _saveResult: z
    .object({
      success: z.boolean(),
      productId: z.string().optional(),
      itemUUID: z.string().optional(),
      error: z.string().optional(),
    })
    .optional(),
  _aiMetadata: z.record(z.string(), aiFieldSourceSchema).optional(),
});

export const bulkSaveRequestSchema = z.object({
  products: z.array(erfassungPayloadSchema),
  action: erfassungActionSchema,
});

export const bulkSaveResponseSchema = z.object({
  total: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  results: z.array(
    z.object({
      index: z.number(),
      success: z.boolean(),
      productId: z.string().optional(),
      itemUUID: z.string().optional(),
      error: z.string().optional(),
    }),
  ),
});

// =============================================================================
// DERIVED TYPES (SSOT — all types derived from schemas)
// =============================================================================

export type SpecField = z.infer<typeof specFieldSchema>;
export type VerificationSource = z.infer<typeof verificationSourceSchema>;
export type AIFieldSource = z.infer<typeof aiFieldSourceSchema>;
export type ErfassungFormData = z.infer<typeof erfassungFormDataSchema>;
export type AIFieldMetadata = {
  [K in keyof ErfassungFormData]?: AIFieldSource;
};
export type VoiceProductData = z.infer<typeof voiceProductDataSchema>;
export type ErfassungPayload = z.infer<typeof erfassungPayloadSchema>;
export type BulkProductStatus = z.infer<typeof bulkProductStatusSchema>;
export type BulkProductSource = z.infer<typeof bulkProductSourceSchema>;
export type BulkProduct = z.infer<typeof bulkProductSchema>;
export type BulkSaveRequest = z.infer<typeof bulkSaveRequestSchema>;
export type BulkSaveResponse = z.infer<typeof bulkSaveResponseSchema>;
export type ErfassungAction = z.infer<typeof erfassungActionSchema>;
