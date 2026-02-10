import { z } from 'zod'
import { uuidSchema } from './common'

export const PublishMedusaSchema = z.object({
  inventoryItemId: uuidSchema,
  options: z.record(z.string(), z.unknown()).optional().default({}),
})

export type PublishMedusaInput = z.infer<typeof PublishMedusaSchema>

export const ImportCSVSchema = z.object({
  csvContent: z.string().min(1, 'CSV-Inhalt ist erforderlich'),
  options: z.record(z.string(), z.unknown()).optional().default({}),
})

export type ImportCSVInput = z.infer<typeof ImportCSVSchema>

export const PublishMedusaQuerySchema = z.object({
  inventoryItemId: uuidSchema,
})

export type PublishMedusaQuery = z.infer<typeof PublishMedusaQuerySchema>
