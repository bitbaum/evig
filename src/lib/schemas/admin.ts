/**
 * Admin Zod Schemas
 *
 * Validation schemas for admin-only operations.
 * Types are derived from these schemas (SSOT).
 */

import { z } from 'zod';
import { uuidSchema } from './common';

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
  action: z.enum(['approve', 'reject']),
});

export type AdminApprovalActionInput = z.infer<typeof AdminApprovalActionSchema>;

// =============================================================================
// WORKSHOP REGISTRATION MANAGEMENT
// =============================================================================

export const AdminWorkshopRegistrationUpdateSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'waitlist', 'attended', 'cancelled', 'no_show'])
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
