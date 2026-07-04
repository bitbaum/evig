/**
 * Marketplace Zod Schemas
 *
 * Validation schemas for the P2P marketplace.
 * Derives enum values from config SSOT — never hardcode here.
 */

import { z } from 'zod';
import {
  MARKETPLACE_CATEGORY_VALUES,
  LISTING_CONDITIONS,
  DELIVERY_OPTIONS,
  PAYMENT_MODES,
  MARKETPLACE_LIMITS,
  LISTING_STATUSES,
  ORDER_STATUSES,
  REPORT_REASONS,
  MARKETPLACE_SELLER_TYPE,
} from '@/config/marketplace';
import { paginationSchema } from './common';

// ============================================================================
// Listing Spec (for create/update payloads)
// ============================================================================

export const ListingSpecSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(500),
  unit: z.string().max(50).optional().nullable(),
});

export type ListingSpecInput = z.infer<typeof ListingSpecSchema>;

// ============================================================================
// Condition Checks (category-specific condition criteria)
// ============================================================================

export const ConditionCheckSchema = z.object({
  key: z.string().min(1).max(100),
  checked: z.boolean(),
});

export type ConditionCheckInput = z.infer<typeof ConditionCheckSchema>;

// ============================================================================
// Browse / Query
// ============================================================================

export const ListingsQuerySchema = z.object({
  category: z.string().optional(),
  condition: z.enum(LISTING_CONDITIONS as unknown as [string, ...string[]]).optional(),
  delivery: z.enum(DELIVERY_OPTIONS as unknown as [string, ...string[]]).optional(),
  payment: z.enum(PAYMENT_MODES as unknown as [string, ...string[]]).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular'] as const).default('newest'),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().max(MARKETPLACE_LIMITS.MAX_PRICE_CHF).optional(),
  seller_type: z.enum(Object.values(MARKETPLACE_SELLER_TYPE) as [string, ...string[]]).optional(),
  status: z.enum(LISTING_STATUSES as unknown as [string, ...string[]]).optional(),
  // Phase 1 additions
  gratis_only: z.coerce.boolean().optional(),
  verified_only: z.coerce.boolean().optional(),
  // Spec filters (min values for numeric specs)
  spec_ram_min: z.coerce.number().min(0).optional(),
  spec_storage_min: z.coerce.number().min(0).optional(),
  spec_display_min: z.coerce.number().min(0).optional(),
}).merge(paginationSchema);

export type ListingsQuery = z.infer<typeof ListingsQuerySchema>;

// ============================================================================
// Create Listing
// ============================================================================

export const CreateListingSchema = z.object({
  title: z.string()
    .min(3, 'Titel muss mindestens 3 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_TITLE_LENGTH, `Titel darf maximal ${MARKETPLACE_LIMITS.MAX_TITLE_LENGTH} Zeichen lang sein`),
  description: z.string()
    .min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH, `Beschreibung darf maximal ${MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH} Zeichen lang sein`),
  price_chf: z.number()
    .min(0, 'Preis muss mindestens 0 sein')
    .max(MARKETPLACE_LIMITS.MAX_PRICE_CHF, `Preis darf maximal ${MARKETPLACE_LIMITS.MAX_PRICE_CHF} CHF sein`),
  category: z.enum(MARKETPLACE_CATEGORY_VALUES, {
    error: 'Ungültige Kategorie',
  }),
  condition: z.enum(LISTING_CONDITIONS as unknown as [string, ...string[]], {
    error: 'Ungültiger Zustand',
  }).default('good'),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  images: z.array(
    z.string().refine(
      (s) => s.startsWith('/uploads/') || s.startsWith('http://') || s.startsWith('https://'),
      'Ungültige Bild-URL',
    ))
    .max(MARKETPLACE_LIMITS.MAX_IMAGES, `Maximal ${MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erlaubt`)
    .default([]),
  delivery_options: z.enum(DELIVERY_OPTIONS as unknown as [string, ...string[]]).default('pickup'),
  shipping_cost_chf: z.number().min(0).optional().nullable(),
  pickup_location: z.string().max(200).optional().nullable(),
  payment_mode: z.enum(PAYMENT_MODES as unknown as [string, ...string[]]).default('both'),
  status: z.enum(['active', 'draft'] as const).default('active'),
  // Phase 1 additions
  specs: z.array(ListingSpecSchema).max(30).optional(),
  condition_checks: z.array(ConditionCheckSchema).max(20).optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// ============================================================================
// Update Listing
// ============================================================================

export const UpdateListingSchema = z.object({
  title: z.string()
    .min(3, 'Titel muss mindestens 3 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_TITLE_LENGTH)
    .optional(),
  description: z.string()
    .min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH)
    .optional(),
  price_chf: z.number().min(0).max(MARKETPLACE_LIMITS.MAX_PRICE_CHF).optional(),
  category: z.string().optional(),
  condition: z.enum(LISTING_CONDITIONS as unknown as [string, ...string[]]).optional(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  // No .min(1): create allows image-less listings (images defaults to []), so
  // edit must too — otherwise an image-less listing can never be saved.
  images: z.array(z.string().refine(
    (s) => s.startsWith('/uploads/') || s.startsWith('http://') || s.startsWith('https://'),
    'Ungültige Bild-URL',
  )).max(MARKETPLACE_LIMITS.MAX_IMAGES).optional(),
  delivery_options: z.enum(DELIVERY_OPTIONS as unknown as [string, ...string[]]).optional(),
  shipping_cost_chf: z.number().min(0).optional().nullable(),
  pickup_location: z.string().max(200).optional().nullable(),
  payment_mode: z.enum(PAYMENT_MODES as unknown as [string, ...string[]]).optional(),
  status: z.enum(LISTING_STATUSES as unknown as [string, ...string[]]).optional(),
  // Phase 1 additions
  specs: z.array(ListingSpecSchema).max(30).optional(),
  condition_checks: z.array(ConditionCheckSchema).max(20).optional(),
});

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

// ============================================================================
// Contact Seller
// ============================================================================

export const ContactSellerSchema = z.object({
  message: z.string()
    .min(5, 'Nachricht muss mindestens 5 Zeichen lang sein')
    .max(2000, 'Nachricht darf maximal 2000 Zeichen lang sein'),
});

export type ContactSellerInput = z.infer<typeof ContactSellerSchema>;

// ============================================================================
// Listing Questions (public Q&A)
// ============================================================================

export const AskListingQuestionSchema = z.object({
  question: z.string()
    .min(5, 'Frage muss mindestens 5 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_QUESTION_LENGTH, `Frage darf maximal ${MARKETPLACE_LIMITS.MAX_QUESTION_LENGTH} Zeichen lang sein`),
});

export type AskListingQuestionInput = z.infer<typeof AskListingQuestionSchema>;

export const AnswerListingQuestionSchema = z.object({
  answer: z.string()
    .min(5, 'Antwort muss mindestens 5 Zeichen lang sein')
    .max(MARKETPLACE_LIMITS.MAX_ANSWER_LENGTH, `Antwort darf maximal ${MARKETPLACE_LIMITS.MAX_ANSWER_LENGTH} Zeichen lang sein`),
});

export type AnswerListingQuestionInput = z.infer<typeof AnswerListingQuestionSchema>;

// ============================================================================
// Create Order (secure payment)
// ============================================================================

export const CreateOrderSchema = z.object({
  listing_id: z.string().uuid('Ungültige Listing-ID'),
  delivery_method: z.enum(['pickup', 'shipping'] as const),
  shipping_address: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().regex(/^\d{4}$/, 'Ungültige Postleitzahl'),
    country: z.string().default('CH'),
  }).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ============================================================================
// Orders Query (list my orders)
// ============================================================================

export const OrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]).optional(),
  role: z.enum(['buyer', 'seller'] as const).default('buyer'),
}).merge(paginationSchema);

export type OrdersQuery = z.infer<typeof OrdersQuerySchema>;

// ============================================================================
// Update Order Status
// ============================================================================

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]], {
    error: 'Ungültiger Bestellstatus',
  }),
  tracking_number: z.string().max(200).optional().nullable(),
  tracking_url: z.string().url().max(500).optional().nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ============================================================================
// Admin Verify Listing
// ============================================================================

export const VerifyListingSchema = z.object({
  verification_notes: z.string().max(2000).optional().nullable(),
});

export type VerifyListingInput = z.infer<typeof VerifyListingSchema>;

// ============================================================================
// Report Listing
// ============================================================================

const reportReasonValues = REPORT_REASONS.map(r => r.value) as [string, ...string[]];

export const ReportListingSchema = z.object({
  reason: z.enum(reportReasonValues, {
    error: 'Ungültiger Meldegrund',
  }),
  details: z.string().max(2000).optional().nullable(),
});

export type ReportListingInput = z.infer<typeof ReportListingSchema>;

// ============================================================================
// Admin Schemas
// ============================================================================

export const AdminListingsQuerySchema = z.object({
  status: z.enum(['all', ...LISTING_STATUSES] as [string, ...string[]]).default('all'),
  category: z.string().optional(),
  seller_type: z.enum(['all', ...Object.values(MARKETPLACE_SELLER_TYPE)] as [string, ...string[]]).default('all'),
  verified: z.enum(['all', 'yes', 'no'] as const).default('all'),
  reported: z.enum(['all', 'yes'] as const).default('all'),
  search: z.string().max(200).optional(),
}).merge(paginationSchema);

export type AdminListingsQuery = z.infer<typeof AdminListingsQuerySchema>;

export const AdminEditListingSchema = z.object({
  title: z.string().min(3).max(MARKETPLACE_LIMITS.MAX_TITLE_LENGTH).optional(),
  description: z.string().min(10).max(MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
  price_chf: z.number().min(0).max(MARKETPLACE_LIMITS.MAX_PRICE_CHF).optional(),
  category: z.string().optional(),
  condition: z.enum(LISTING_CONDITIONS as unknown as [string, ...string[]]).optional(),
  status: z.enum(LISTING_STATUSES as unknown as [string, ...string[]]).optional(),
  admin_notes: z.string().max(5000).optional().nullable(),
});

export type AdminEditListingInput = z.infer<typeof AdminEditListingSchema>;

export const HandleReportSchema = z.object({
  action: z.enum(['dismiss', 'warn_seller', 'remove_listing'] as const),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export type HandleReportInput = z.infer<typeof HandleReportSchema>;

export const AdminOrdersQuerySchema = z.object({
  status: z.enum(['all', ...ORDER_STATUSES] as [string, ...string[]]).default('all'),
}).merge(paginationSchema);

export type AdminOrdersQuery = z.infer<typeof AdminOrdersQuerySchema>;

export const AdminReportsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'reviewed'] as const).default('pending'),
}).merge(paginationSchema);

export type AdminReportsQuery = z.infer<typeof AdminReportsQuerySchema>;
