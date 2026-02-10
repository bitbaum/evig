import { z } from 'zod'

// --- Reusable field schemas ---

export const uuidSchema = z.string().uuid('Ungültige ID')

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const swissPostalCodeSchema = z.string().regex(/^\d{4}$/, 'Ungültige Postleitzahl')

export const phoneSchema = z.string().min(10, 'Ungültige Telefonnummer')

export const ratingSchema = z.coerce.number().int().min(1, 'Bewertung muss mindestens 1 sein').max(5, 'Bewertung darf maximal 5 sein')

export const optionalRatingSchema = ratingSchema.optional().nullable()
