/**
 * Admin Zod Schemas
 *
 * Validation schemas for admin-only operations.
 * Types are derived from these schemas (SSOT).
 */

import { z } from 'zod';
import { uuidSchema } from './common';
import { WORKSHOP_REGISTRATION_STATUS_VALUES } from '@/config/workshop-registration-status';

// =============================================================================
// ADMIN AUTH
// =============================================================================

export const AdminAuthActionSchema = z.object({
  action: z.enum(['login', 'logout']).optional(),
  password: z.string().optional(),
});

export type AdminAuthActionInput = z.infer<typeof AdminAuthActionSchema>;

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const AdminUpdateUserSchema = z.object({
  name: z.string().max(100, 'Name darf maximal 100 Zeichen enthalten').optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  is_staff: z.boolean().optional(),
});

export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

// =============================================================================
// APPROVAL ACTIONS
// =============================================================================

export const AdminApprovalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'reopen']),
});

export type AdminApprovalActionInput = z.infer<typeof AdminApprovalActionSchema>;

// =============================================================================
// WORKSHOP REGISTRATION MANAGEMENT
// =============================================================================

export const AdminWorkshopRegistrationUpdateSchema = z.object({
  status: z
    .enum(WORKSHOP_REGISTRATION_STATUS_VALUES)
    .optional(),
  attended: z.boolean().optional(),
  notes: z.string().max(2000, 'Notizen dürfen maximal 2000 Zeichen enthalten').optional().nullable(),
});

export type AdminWorkshopRegistrationUpdateInput = z.infer<typeof AdminWorkshopRegistrationUpdateSchema>;

// =============================================================================
// WORKSHOP COMMUNICATIONS
// =============================================================================

export const AdminSendFeedbackRequestsSchema = z.object({
  daysAfterWorkshop: z.coerce
    .number()
    .int('Tage müssen eine ganze Zahl sein')
    .min(1, 'Mindestens 1 Tag nach Workshop')
    .max(30, 'Maximal 30 Tage nach Workshop')
    .default(1),
});

export type AdminSendFeedbackRequestsInput = z.infer<typeof AdminSendFeedbackRequestsSchema>;

export const AdminSendRemindersSchema = z.object({
  daysBeforeWorkshop: z.coerce
    .number()
    .int('Tage müssen eine ganze Zahl sein')
    .min(1, 'Mindestens 1 Tag vor Workshop')
    .max(30, 'Maximal 30 Tage vor Workshop')
    .default(1),
});

export type AdminSendRemindersInput = z.infer<typeof AdminSendRemindersSchema>;

// =============================================================================
// SERVICE MANAGEMENT
// =============================================================================

export const AdminCreateServiceSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  slug: z.string().min(1, 'Slug ist erforderlich').regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  durationMinutes: z.coerce.number().int().positive().optional().default(60),
  priceCents: z.coerce.number().int().min(0).optional().nullable(),
  requiresApproval: z.boolean().optional().default(false),
  isBookable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().min(0).optional().default(100),
  // Presentation fields
  iconName: z.string().max(100).optional().default('Wrench'),
  heroTitle: z.string().max(200).optional().nullable(),
  heroSubtitle: z.string().max(300).optional().nullable(),
  heroDescription: z.string().max(2000).optional().nullable(),
  features: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  process: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  pricingBase: z.string().max(200).optional().nullable(),
  pricingDetails: z.array(z.string()).optional().default([]),
  pricingMediaPrices: z.array(z.string()).optional().nullable(),
});

export type AdminCreateServiceInput = z.infer<typeof AdminCreateServiceSchema>;

// =============================================================================
// ERFASSUNG (PRODUCT DATA ENTRY) - BULK OPERATIONS
// =============================================================================

export const BulkSaveSchema = z.object({
  products: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'Keine Produkte zum Speichern'),
  action: z.enum(['draft', 'erfassen', 'publish']),
});

export type BulkSaveInput = z.infer<typeof BulkSaveSchema>;

export const BulkEnrichSchema = z.object({
  items: z
    .array(
      z.object({
        _tempId: z.string(),
        hersteller: z.string(),
        produktname: z.string(),
        kurzbeschreibung: z.string().optional(),
        hauptkategorie: z.string().optional(),
        zustand: z.string().optional(),
        verkaufspreis: z.string().optional(),
      })
    )
    .min(1, 'Keine Produkte zum Anreichern'),
});

export type BulkEnrichInput = z.infer<typeof BulkEnrichSchema>;

export const BulkTextSchema = z.object({
  text: z.string().min(10, 'Text ist zu kurz für Mehrfacherfassung'),
});

export type BulkTextInput = z.infer<typeof BulkTextSchema>;

// =============================================================================
// ERFASSUNG - SINGLE PRODUCT CREATE
// =============================================================================

export const ErfassungCreateSchema = z
  .object({
    hersteller: z.string().min(1, 'Hersteller ist erforderlich'),
    produktname: z.string().min(1, 'Produktname ist erforderlich'),
    verkaufspreis: z.coerce.number().min(0, 'Gültiger Verkaufspreis ist erforderlich'),
    action: z.enum(['draft', 'erfassen', 'publish']).optional(),
    publish: z.boolean().optional(),
  })
  .passthrough();

export type ErfassungCreateInput = z.infer<typeof ErfassungCreateSchema>;

// =============================================================================
// ADMIN PRODUCT MANAGEMENT
// =============================================================================

export const AdminCreateProductSchema = z.object({
  title: z.string().max(500).optional(),
  product_name: z.string().max(500).optional(),
  brand: z.string().max(200).optional().default(''),
  description: z.string().max(5000).optional(),
  short_description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0).optional(),
  estimated_price_chf: z.coerce.number().min(0).optional(),
  condition: z.string().max(100).optional().default('unknown'),
  category: z.string().max(100).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  quantity: z.coerce.number().int().min(1).optional().default(1),
}).refine(
  data => !!(data.title || data.product_name),
  { message: 'Produktname oder Titel ist erforderlich', path: ['product_name'] }
);

export type AdminCreateProductInput = z.infer<typeof AdminCreateProductSchema>;

export const AdminUpdateProductSchema = z.object({
  product_name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  brand: z.string().max(200).optional(),
  short_description: z.string().max(5000).optional(),
  description: z.string().max(5000).optional(),
  estimated_price_chf: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  condition: z.string().max(100).optional(),
  category: z.string().max(100).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional(),
  quantity_available: z.coerce.number().int().min(0).optional(),
  marketplace_status: z.string().max(50).optional(),
});

export type AdminUpdateProductInput = z.infer<typeof AdminUpdateProductSchema>;

// =============================================================================
// HIRN AI CHAT
// =============================================================================

export const HirnChatSchema = z.object({
  message: z.string().min(1, 'Nachricht ist erforderlich'),
  sessionId: z.string().min(1, 'Session-ID ist erforderlich'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  /** Current admin pathname — used to add page context to the system prompt. */
  pathname: z.string().max(300).optional(),
});

export type HirnChatInput = z.infer<typeof HirnChatSchema>;

export const HirnProviderUpdateSchema = z.object({
  provider: z.string().min(1, 'Provider ist erforderlich'),
  isDefault: z.boolean().optional(),
  apiKey: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export type HirnProviderUpdateInput = z.infer<typeof HirnProviderUpdateSchema>;

// =============================================================================
// CERTIFICATION MANAGEMENT
// =============================================================================

export const CertificationVerifySchema = z.object({
  adminNotes: z.string().max(5000).optional().nullable(),
  verificationResult: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CertificationVerifyInput = z.infer<typeof CertificationVerifySchema>;

export const CertificationRejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Ein Ablehnungsgrund ist erforderlich').max(2000),
  adminNotes: z.string().max(5000).optional().nullable(),
});

export type CertificationRejectInput = z.infer<typeof CertificationRejectSchema>;

// =============================================================================
// ADMIN PERMISSIONS
// =============================================================================

export const AdminPermissionsSchema = z.object({
  permissions: z.array(z.string()).optional(),
  isSuperAdmin: z.boolean().optional(),
});

export type AdminPermissionsInput = z.infer<typeof AdminPermissionsSchema>;

// =============================================================================
// SMART PRODUCT ENTRY (AI)
// =============================================================================

export const SmartProductEntrySchema = z.object({
  query: z.string().min(1, 'Bitte gib einen Produktnamen ein').max(500),
  inputType: z.enum(['text', 'voice', 'image']).optional().default('text'),
});

export type SmartProductEntryInput = z.infer<typeof SmartProductEntrySchema>;
