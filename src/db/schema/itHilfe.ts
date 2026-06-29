import { pgTable, uuid, text, boolean, timestamp, integer, decimal, varchar, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { repairerProfiles } from './services'

// =============================================================================
// IT-HILFE REQUESTS (originally peer_repair_requests, renamed in migration 013)
// =============================================================================
// Community members post requests for IT help.
// Final state includes service_category (013) and ai_diagnosis (026).
// CHECK constraints on urgency, budget_type, service_type, status — validated at app layer

export const itHilfeRequests = pgTable('it_hilfe_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Device details
  categoryId: varchar('category_id', { length: 50 }).notNull(),
  deviceBrand: varchar('device_brand', { length: 100 }),
  deviceModel: varchar('device_model', { length: 200 }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),

  // Request parameters
  urgency: varchar('urgency', { length: 20 }).default('normal'),
  budgetType: varchar('budget_type', { length: 20 }).notNull(),
  budgetAmountCents: integer('budget_amount_cents'),
  budgetTier: varchar('budget_tier', { length: 20 }),

  // Location (Swiss postal code system)
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  canton: varchar('canton', { length: 50 }).notNull(),

  // Service preferences
  serviceType: varchar('service_type', { length: 20 }).default('flexible'),
  skillsNeeded: text('skills_needed').array(),
  imageUrls: text('image_urls').array(),
  // Optional technician explicitly chosen from a public profile. The request
  // remains visible to other eligible technicians until an offer is accepted.
  preferredTechnicianId: uuid('preferred_technician_id').references(() => repairerProfiles.id, { onDelete: 'set null' }),

  // Status tracking
  status: varchar('status', { length: 30 }).default('open'),
  matchedOfferId: uuid('matched_offer_id'),
  offerCount: integer('offer_count').default(0),

  // Service category (added by 013)
  serviceCategory: varchar('service_category', { length: 50 }).default('repair'),

  // AI diagnosis (added by 026)
  aiDiagnosis: text('ai_diagnosis'),

  // Admin management (added by 045)
  adminNotes: text('admin_notes'),

  // Completion tracking (added by 058)
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  // Timestamps
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_it_hilfe_requests_user_id').on(table.requesterId),
  index('idx_it_hilfe_requests_status').on(table.status),
  index('idx_it_hilfe_requests_category').on(table.categoryId),
  index('idx_peer_repair_requests_postal_code').on(table.postalCode),
  index('idx_peer_repair_requests_canton').on(table.canton),
  index('idx_peer_repair_requests_created').on(table.createdAt),
  index('idx_it_hilfe_requests_preferred_technician').on(table.preferredTechnicianId),
  index('idx_peer_repair_requests_browse').on(table.status, table.canton, table.createdAt),
])

export type ItHilfeRequest = typeof itHilfeRequests.$inferSelect
export type NewItHilfeRequest = typeof itHilfeRequests.$inferInsert

// =============================================================================
// IT-HILFE OFFERS (originally peer_repair_offers, renamed in migration 013)
// =============================================================================
// Offers from community helpers responding to IT help requests.

export const itHilfeOffers = pgTable('it_hilfe_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => itHilfeRequests.id, { onDelete: 'cascade' }),
  helperId: uuid('helper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Offer details
  message: text('message').notNull(),
  estimatedTime: varchar('estimated_time', { length: 50 }),
  proposedCompensation: varchar('proposed_compensation', { length: 100 }),
  // Added by 101: structured compensation (the free-text field above stays for
  // optional context). The accepted offer's amount is the agreed compensation.
  proposedAmountCents: integer('proposed_amount_cents'),
  relevantSkills: text('relevant_skills').array(),

  // Status
  status: varchar('status', { length: 20 }).default('pending'),

  // Added by 051: Link to repairer profile (if offer is from a registered repairer)
  repairerProfileId: uuid('repairer_profile_id').references(() => repairerProfiles.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_it_hilfe_offers_request_id').on(table.requestId),
  index('idx_it_hilfe_offers_helper_id').on(table.helperId),
  index('idx_it_hilfe_offers_status').on(table.status),
  index('idx_it_hilfe_offers_repairer_profile').on(table.repairerProfileId),
])

export type ItHilfeOffer = typeof itHilfeOffers.$inferSelect
export type NewItHilfeOffer = typeof itHilfeOffers.$inferInsert

// =============================================================================
// USER SKILLS
// =============================================================================
// IT skills that users can offer to help others.

export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillId: varchar('skill_id', { length: 50 }).notNull(),
  categoryId: varchar('category_id', { length: 50 }).notNull(),

  // Verification
  verified: boolean('verified').default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'string' }),
  verifiedBy: uuid('verified_by').references(() => users.id),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_user_skills_user_id').on(table.userId),
  index('idx_user_skills_skill_id').on(table.skillId),
  index('idx_user_skills_category_id').on(table.categoryId),
  index('idx_user_skills_verified').on(table.verified),
])

export type UserSkill = typeof userSkills.$inferSelect
export type NewUserSkill = typeof userSkills.$inferInsert
