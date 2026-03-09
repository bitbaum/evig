import { z } from 'zod'

// 5MB max CSV content size
const MAX_CSV_SIZE = 5 * 1024 * 1024

export const ImportCSVSchema = z.object({
  csvContent: z.string()
    .min(1, 'CSV-Inhalt ist erforderlich')
    .max(MAX_CSV_SIZE, `CSV-Datei darf maximal 5 MB gross sein`),
  options: z.record(z.string(), z.unknown()).optional().default({}),
})

export type ImportCSVInput = z.infer<typeof ImportCSVSchema>

// =============================================================================
// INVENTORY PRODUCT UPDATE
// =============================================================================

export const InventoryUpdateSchema = z.object({
  product_name: z.string().max(500).optional(),
  brand: z.string().max(200).optional(),
  short_description: z.string().max(5000).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  estimated_price_chf: z.coerce.number().min(0).optional(),
  condition: z.string().max(100).optional(),
  category: z.string().max(100).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  weight_grams: z.coerce.number().min(0).optional().nullable(),
  status: z.string().max(50).optional(),
  location: z.string().max(200).optional().nullable(),
  box_id: z.string().max(100).optional().nullable(),
  quantity_available: z.coerce.number().int().min(0).optional(),
  image: z.string().optional(),
})

export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>

export const InventoryPatchSchema = z.object({
  marketplace_status: z.enum(['draft', 'published']).optional(),
  status: z.enum(['pending_review', 'approved', 'rejected']).optional(),
})

export type InventoryPatchInput = z.infer<typeof InventoryPatchSchema>
