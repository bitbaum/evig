import { z } from 'zod'

export const AnalyzeProductSchema = z.object({
  image: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  saveToDatabase: z.boolean().default(false),
  userId: z.string().optional().nullable(),
}).refine(
  (data) => !!data.image || !!data.imageUrl,
  { message: 'Bilddaten oder URL erforderlich', path: ['image'] }
)

export type AnalyzeProductInput = z.infer<typeof AnalyzeProductSchema>
