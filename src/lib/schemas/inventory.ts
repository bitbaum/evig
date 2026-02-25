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
