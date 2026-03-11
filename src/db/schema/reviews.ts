import { pgTable, uuid, text, boolean, timestamp, integer, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// REVIEWS
// =============================================================================
// User reviews and ratings for repairers, services, and workshops.
// From 008_rating_review_system.sql.
// CHECK (target_type IN ('repairer', 'service', 'workshop'))
// CHECK (overall_rating >= 1 AND overall_rating <= 5)
// CHECK (communication_rating >= 1 AND communication_rating <= 5)
// CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5)
// CHECK (quality_rating >= 1 AND quality_rating <= 5)
// CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5)
// CHECK (value_rating >= 1 AND value_rating <= 5)
// CHECK (status IN ('published', 'pending_moderation', 'hidden', 'deleted'))
// UNIQUE (reviewer_id, target_type, target_id, booking_id)

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Target (polymorphic: repairer, service, or workshop)
  // CHECK (target_type IN ('repairer', 'service', 'workshop'))
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: uuid('target_id').notNull(),
  bookingId: uuid('booking_id'),

  // Ratings (all CHECK >= 1 AND <= 5)
  overallRating: integer('overall_rating').notNull(),
  communicationRating: integer('communication_rating'),
  professionalismRating: integer('professionalism_rating'),
  qualityRating: integer('quality_rating'),
  timelinessRating: integer('timeliness_rating'),
  valueRating: integer('value_rating'),

  // Content
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),

  // Verification and votes
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  helpfulVotes: integer('helpful_votes').notNull().default(0),
  totalVotes: integer('total_votes').notNull().default(0),

  // Status — CHECK (status IN ('published', 'pending_moderation', 'hidden', 'deleted'))
  status: varchar('status', { length: 20 }).notNull().default('published'),

  // Moderation
  moderationReason: text('moderation_reason'),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at', { withTimezone: true, mode: 'string' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_reviews_reviewer_id').on(table.reviewerId),
  index('idx_reviews_target').on(table.targetType, table.targetId),
  index('idx_reviews_status').on(table.status),
  index('idx_reviews_rating').on(table.overallRating),
  index('idx_reviews_created_at').on(table.createdAt),
  index('idx_reviews_helpful').on(table.helpfulVotes, table.totalVotes),
  uniqueIndex('reviews_reviewer_target_booking_unique').on(table.reviewerId, table.targetType, table.targetId, table.bookingId),
])

export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert

// =============================================================================
// REVIEW ATTACHMENTS
// =============================================================================
// Images, videos, and documents attached to reviews.
// From 008_rating_review_system.sql.
// CHECK (attachment_type IN ('image', 'video', 'document'))

export const reviewAttachments = pgTable('review_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),

  // File information
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: varchar('mime_type', { length: 100 }),

  // Type — CHECK (attachment_type IN ('image', 'video', 'document'))
  attachmentType: varchar('attachment_type', { length: 20 }).default('image'),
  sortOrder: integer('sort_order').default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_review_attachments_review_id').on(table.reviewId),
])

export type ReviewAttachment = typeof reviewAttachments.$inferSelect
export type NewReviewAttachment = typeof reviewAttachments.$inferInsert

// =============================================================================
// REVIEW RESPONSES
// =============================================================================
// Repairer/provider responses to reviews.
// From 008_rating_review_system.sql.
// CHECK (status IN ('published', 'pending_moderation', 'hidden'))
// UNIQUE (review_id) — one response per review

export const reviewResponses = pgTable('review_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().unique().references(() => reviews.id, { onDelete: 'cascade' }),
  responderId: uuid('responder_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Content
  content: text('content').notNull(),

  // Status — CHECK (status IN ('published', 'pending_moderation', 'hidden'))
  status: varchar('status', { length: 20 }).notNull().default('published'),

  // Moderation
  moderationReason: text('moderation_reason'),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at', { withTimezone: true, mode: 'string' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_review_responses_review_id').on(table.reviewId),
  index('idx_review_responses_responder_id').on(table.responderId),
  index('idx_review_responses_status').on(table.status),
])

export type ReviewResponse = typeof reviewResponses.$inferSelect
export type NewReviewResponse = typeof reviewResponses.$inferInsert

// =============================================================================
// REVIEW VOTES
// =============================================================================
// Helpful/unhelpful votes on reviews.
// From 008_rating_review_system.sql.
// CHECK (vote_type IN ('helpful', 'unhelpful'))
// UNIQUE (review_id, voter_id) — one vote per user per review

export const reviewVotes = pgTable('review_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  voterId: uuid('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Vote — CHECK (vote_type IN ('helpful', 'unhelpful'))
  voteType: varchar('vote_type', { length: 10 }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_review_votes_review_id').on(table.reviewId),
  index('idx_review_votes_voter_id').on(table.voterId),
  uniqueIndex('review_votes_review_voter_unique').on(table.reviewId, table.voterId),
])

export type ReviewVote = typeof reviewVotes.$inferSelect
export type NewReviewVote = typeof reviewVotes.$inferInsert

// =============================================================================
// REVIEW MODERATION LOG
// =============================================================================
// Admin moderation actions on reviews and responses.
// From 008_rating_review_system.sql.
// CHECK (action IN ('approve', 'hide', 'delete', 'restore', 'flag_spam', 'flag_inappropriate'))

export const reviewModerationLog = pgTable('review_moderation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  responseId: uuid('response_id').references(() => reviewResponses.id, { onDelete: 'set null' }),

  // Action — CHECK (action IN ('approve', 'hide', 'delete', 'restore', 'flag_spam', 'flag_inappropriate'))
  action: varchar('action', { length: 50 }).notNull(),
  reason: text('reason'),
  adminId: uuid('admin_id').notNull().references(() => users.id),

  // Status transition
  oldStatus: varchar('old_status', { length: 20 }),
  newStatus: varchar('new_status', { length: 20 }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_review_moderation_log_review_id').on(table.reviewId),
  index('idx_review_moderation_log_admin_id').on(table.adminId),
])

export type ReviewModerationLog = typeof reviewModerationLog.$inferSelect
export type NewReviewModerationLog = typeof reviewModerationLog.$inferInsert

// =============================================================================
// NOTE: Repairer-specific reviews (repairer_reviews) are defined in
// src/db/schema/services.ts, based on 008_repairer_system.sql.
// =============================================================================
