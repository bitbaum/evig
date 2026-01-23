import { z } from 'zod';
import { REVIEW_TARGET_TYPES } from '@/config/database';

// Rating validation (1-5 stars)
const ratingSchema = z.number()
  .int('Bewertung muss eine ganze Zahl sein')
  .min(1, 'Bewertung muss mindestens 1 sein')
  .max(5, 'Bewertung darf maximal 5 sein');

const optionalRatingSchema = ratingSchema.optional().nullable();

// Valid target types - derived from SSOT
const validTargetTypes = Object.values(REVIEW_TARGET_TYPES) as [string, ...string[]];

// Create review schema
export const CreateReviewSchema = z.object({
  targetType: z.enum(validTargetTypes),
  targetId: z.string().uuid('Ungueltige targetId'),
  bookingId: z.string().uuid('Ungueltige bookingId').optional().nullable(),
  overallRating: ratingSchema,
  communicationRating: optionalRatingSchema,
  professionalismRating: optionalRatingSchema,
  qualityRating: optionalRatingSchema,
  timelinessRating: optionalRatingSchema,
  valueRating: optionalRatingSchema,
  title: z.string()
    .max(200, 'Titel darf maximal 200 Zeichen lang sein')
    .optional()
    .nullable(),
  content: z.string()
    .min(10, 'Bewertungstext muss mindestens 10 Zeichen lang sein')
    .max(5000, 'Bewertungstext darf maximal 5000 Zeichen lang sein'),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// Get reviews query params schema
export const GetReviewsQuerySchema = z.object({
  targetType: z.enum(validTargetTypes),
  targetId: z.string().uuid('Ungueltige targetId'),
  status: z.enum(['published', 'pending_moderation', 'hidden', 'deleted'])
    .optional()
    .default('published'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['created_at', 'overall_rating', 'helpful_votes'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;

// Update review schema
export const UpdateReviewSchema = z.object({
  overallRating: ratingSchema.optional(),
  communicationRating: optionalRatingSchema,
  professionalismRating: optionalRatingSchema,
  qualityRating: optionalRatingSchema,
  timelinessRating: optionalRatingSchema,
  valueRating: optionalRatingSchema,
  title: z.string()
    .max(200, 'Titel darf maximal 200 Zeichen lang sein')
    .optional()
    .nullable(),
  content: z.string()
    .min(10, 'Bewertungstext muss mindestens 10 Zeichen lang sein')
    .max(5000, 'Bewertungstext darf maximal 5000 Zeichen lang sein')
    .optional(),
});

export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

// Vote on review schema
export const ReviewVoteSchema = z.object({
  voteType: z.enum(['helpful', 'not_helpful']),
});

export type ReviewVoteInput = z.infer<typeof ReviewVoteSchema>;

// Review response schema
export const ReviewResponseSchema = z.object({
  content: z.string()
    .min(10, 'Antwort muss mindestens 10 Zeichen lang sein')
    .max(2000, 'Antwort darf maximal 2000 Zeichen lang sein'),
});

export type ReviewResponseInput = z.infer<typeof ReviewResponseSchema>;

// Moderate review schema
export const ModerateReviewSchema = z.object({
  status: z.enum(['published', 'hidden', 'deleted']),
  moderationNote: z.string()
    .max(500, 'Moderationsnotiz darf maximal 500 Zeichen lang sein')
    .optional(),
});

export type ModerateReviewInput = z.infer<typeof ModerateReviewSchema>;
