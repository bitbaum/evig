import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, varchar, time, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

// =============================================================================
// SERVICE TYPES
// =============================================================================
// Service offerings managed by admins.
// Final state: 001 + 017 (category, is_bookable, is_featured, display_order,
// updated_at) + 018 (icon_name, hero fields, features_json, process_json,
// pricing display fields).

export const serviceTypes = pgTable('service_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(60),
  priceCents: integer('price_cents'),
  requiresApproval: boolean('requires_approval').default(false),
  isActive: boolean('is_active').default(true),

  // Added by 017: alignment with marketing services
  category: text('category'),
  isBookable: boolean('is_bookable').default(true),
  isFeatured: boolean('is_featured').default(false),
  displayOrder: integer('display_order').default(100),

  // Added by 018: presentation fields for admin editing
  iconName: varchar('icon_name', { length: 50 }).default('Wrench'),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  heroDescription: text('hero_description'),
  featuresJson: jsonb('features_json').default([]),
  processJson: jsonb('process_json').default([]),
  pricingBase: text('pricing_base'),
  pricingDetails: jsonb('pricing_details').default([]),
  pricingMediaPrices: jsonb('pricing_media_prices'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_service_types_category').on(table.category),
  index('idx_service_types_is_bookable').on(table.isBookable),
  index('idx_service_types_is_featured').on(table.isFeatured),
  index('idx_service_types_display_order').on(table.displayOrder),
  index('idx_service_types_features_json').using('gin', table.featuresJson),
  index('idx_service_types_process_json').using('gin', table.processJson),
])

export type ServiceType = typeof serviceTypes.$inferSelect
export type NewServiceType = typeof serviceTypes.$inferInsert

// =============================================================================
// SERVICE APPOINTMENTS
// =============================================================================
// Service appointment bookings. Final state: 001 + 009 (repairer assignment,
// repair tracking, quote approval, home visit fields).
// CHECK (urgency IN ('low', 'normal', 'high'))
// CHECK (status IN ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled'))
// CHECK (customer_rating >= 1 AND customer_rating <= 5)

export const serviceAppointments = pgTable('service_appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceTypeId: uuid('service_type_id').notNull().references(() => serviceTypes.id, { onDelete: 'cascade' }),

  // Scheduling
  preferredDate: timestamp('preferred_date', { withTimezone: true, mode: 'string' }),
  confirmedDate: timestamp('confirmed_date', { withTimezone: true, mode: 'string' }),

  // Details
  description: text('description'),
  deviceInfo: text('device_info'),
  // CHECK (urgency IN ('low', 'normal', 'high'))
  urgency: text('urgency').default('normal'),

  // Status — CHECK (status IN ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled'))
  status: text('status').default('requested'),

  // Outcome
  outcomeNotes: text('outcome_notes'),
  priceChargedCents: integer('price_charged_cents'),

  // Added by 009: repairer assignment
  repairerId: uuid('repairer_id').references(() => users.id, { onDelete: 'set null' }),
  repairerProfileId: uuid('repairer_profile_id').references(() => repairerProfiles.id, { onDelete: 'set null' }),

  // Added by 009: repair estimates
  estimatedDurationHours: decimal('estimated_duration_hours', { precision: 5, scale: 2 }),
  quotedPriceChf: decimal('quoted_price_chf', { precision: 10, scale: 2 }),

  // Added by 009: quote approval
  quoteApproved: boolean('quote_approved').default(false),
  quoteApprovedAt: timestamp('quote_approved_at', { withTimezone: true, mode: 'string' }),

  // Added by 009: repair progress
  diagnosisNotes: text('diagnosis_notes'),
  partsNeeded: text('parts_needed').array(),
  partsOrderedAt: timestamp('parts_ordered_at', { withTimezone: true, mode: 'string' }),

  // Added by 009: completion
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  completionNotes: text('completion_notes'),

  // Added by 009: customer rating — CHECK (customer_rating >= 1 AND customer_rating <= 5)
  customerRating: integer('customer_rating'),
  customerReview: text('customer_review'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  // Added by 009: communication
  lastContactAt: timestamp('last_contact_at', { withTimezone: true, mode: 'string' }),
  messagesCount: integer('messages_count').default(0),

  // Added by 009: home visit
  isHomeVisit: boolean('is_home_visit').default(false),
  visitAddress: text('visit_address'),
  visitPostalCode: text('visit_postal_code'),
  visitCity: text('visit_city'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_service_appointments_user_id').on(table.userId),
  index('idx_service_appointments_repairer_id').on(table.repairerId),
  index('idx_service_appointments_repairer_profile_id').on(table.repairerProfileId),
  index('idx_service_appointments_repairer_status').on(table.repairerId, table.status),
])

export type ServiceAppointment = typeof serviceAppointments.$inferSelect
export type NewServiceAppointment = typeof serviceAppointments.$inferInsert

// =============================================================================
// REPAIRER PROFILES
// =============================================================================
// Detailed repairer registration and business information.
// From 008_repairer_system.sql.
// CHECK (business_type IN ('individual', 'business', 'freelance'))
// CHECK (status IN ('pending_review', 'active', 'suspended', 'inactive'))

export const repairerProfiles = pgTable('technician_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Business information
  businessName: text('business_name'),
  // CHECK (business_type IN ('individual', 'business', 'freelance'))
  businessType: text('business_type').notNull().default('individual'),
  description: text('description'),
  yearsExperience: integer('years_experience').default(0),

  // Contact information.
  // phone/address are nullable: self-service community technicians don't enter
  // business contact (they were stored as '' placeholders only because these
  // were NOT NULL — see migration 104). The repairer application flow still
  // populates real business contact for professionals.
  phone: text('phone'),
  website: text('website'),
  address: text('address'),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  canton: text('canton'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  // Services offered
  servicesOffered: text('services_offered').array().notNull().default([]),
  specializations: text('specializations').array().default([]),
  certifications: text('certifications').array().default([]),

  // Service areas
  serviceRadiusKm: integer('service_radius_km').default(50),
  remoteServices: boolean('remote_services').default(false),

  // Pricing
  hourlyRateCents: integer('hourly_rate_cents'),
  emergencyFeeCents: integer('emergency_fee_cents'),
  homeVisitFeeCents: integer('home_visit_fee_cents'),

  // Availability
  availabilitySchedule: jsonb('availability_schedule').default({}),
  responseTimeHours: integer('response_time_hours').default(24),
  typicalTurnaroundDays: integer('typical_turnaround_days').default(3),

  // Verification and ratings
  isVerified: boolean('is_verified').default(false),
  verificationDate: timestamp('verification_date', { withTimezone: true, mode: 'string' }),
  verificationDocuments: text('verification_documents').array().default([]),

  // Performance metrics
  totalJobsCompleted: integer('total_jobs_completed').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.0'),
  totalReviews: integer('total_reviews').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0.0'),

  // Status — CHECK (status IN ('pending_review', 'active', 'suspended', 'inactive'))
  isActive: boolean('is_active').default(true),
  status: text('status').default('pending_review'),

  // Added by 061: community helper fields (merged from helper_profiles)
  acceptsGratis: boolean('accepts_gratis').default(false),
  acceptsKulturlegi: boolean('accepts_kulturlegi').default(false),
  maxTravelKm: integer('max_travel_km').default(10),
  serviceDeliveryTypes: text('service_delivery_types').array().default(sql`'{flexible}'`),
  // Self-serve registrations are 'community'; professional is granted via the
  // admin-approved application flow. (Default aligned in migration 100.)
  profileTier: text('profile_tier').default('community'),

  // Metadata
  portfolioImages: text('portfolio_images').array().default([]),
  insuranceInfo: text('insurance_info'),
  warrantyOffered: boolean('warranty_offered').default(false),
  warrantyDurationMonths: integer('warranty_duration_months'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_repairer_profiles_user_id').on(table.userId),
  index('idx_repairer_profiles_verified').on(table.isVerified),
  index('idx_repairer_profiles_active').on(table.isActive),
  index('idx_repairer_profiles_rating').on(table.averageRating),
  index('idx_repairer_profiles_location').on(table.city, table.postalCode),
  index('idx_repairer_profiles_canton').on(table.canton),
  index('idx_repairer_profiles_services').using('gin', table.servicesOffered),
  index('idx_repairer_profiles_specializations').using('gin', table.specializations),
])

export type RepairerProfile = typeof repairerProfiles.$inferSelect
export type NewRepairerProfile = typeof repairerProfiles.$inferInsert

// =============================================================================
// REPAIRER SERVICES (detailed service offerings)
// =============================================================================
// From 008_repairer_system.sql.
// UNIQUE (repairer_id, service_category, service_name)

export const repairerServices = pgTable('technician_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairerId: uuid('repairer_id').notNull().references(() => repairerProfiles.id, { onDelete: 'cascade' }),

  // Service details
  serviceCategory: text('service_category').notNull(),
  serviceName: text('service_name').notNull(),
  description: text('description'),

  // Pricing
  basePriceCents: integer('base_price_cents'),
  hourlyRateCents: integer('hourly_rate_cents'),
  partsIncluded: boolean('parts_included').default(false),

  // Time estimates
  estimatedHours: decimal('estimated_hours', { precision: 4, scale: 1 }),
  estimatedDays: integer('estimated_days'),

  // Status
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_repairer_services_repairer_id').on(table.repairerId),
  index('idx_repairer_services_category').on(table.serviceCategory),
  uniqueIndex('repairer_services_repairer_category_name_unique').on(table.repairerId, table.serviceCategory, table.serviceName),
])

export type RepairerService = typeof repairerServices.$inferSelect
export type NewRepairerService = typeof repairerServices.$inferInsert

// =============================================================================
// REPAIRER AVAILABILITY
// =============================================================================
// Time slot availability for repairers.
// From 008_repairer_system.sql.
// CHECK (availability_type IN ('available', 'booked', 'blocked'))
// UNIQUE (repairer_id, date, start_time)

export const repairerAvailability = pgTable('technician_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairerId: uuid('repairer_id').notNull().references(() => repairerProfiles.id, { onDelete: 'cascade' }),

  // Time slot
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  durationHours: decimal('duration_hours', { precision: 4, scale: 1 }),

  // Availability type — CHECK (availability_type IN ('available', 'booked', 'blocked'))
  availabilityType: text('availability_type').default('available'),

  // Booking reference (if booked)
  bookingId: uuid('booking_id'),

  // Notes
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_repairer_availability_repairer_id').on(table.repairerId),
  index('idx_repairer_availability_date').on(table.date),
  index('idx_repairer_availability_type').on(table.availabilityType),
  uniqueIndex('repairer_availability_repairer_date_start_unique').on(table.repairerId, table.date, table.startTime),
])

export type RepairerAvailability = typeof repairerAvailability.$inferSelect
export type NewRepairerAvailability = typeof repairerAvailability.$inferInsert

// =============================================================================
// REPAIRER REVIEWS
// =============================================================================
// Customer reviews and ratings for repairers.
// From 008_repairer_system.sql.
// CHECK (rating >= 1 AND rating <= 5)
// CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5)
// CHECK (quality_rating >= 1 AND quality_rating <= 5)
// CHECK (communication_rating >= 1 AND communication_rating <= 5)
// UNIQUE (repairer_id, customer_id, appointment_id)

export const repairerReviews = pgTable('technician_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairerId: uuid('repairer_id').notNull().references(() => repairerProfiles.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Review details
  appointmentId: uuid('appointment_id').references(() => serviceAppointments.id),
  // CHECK (rating >= 1 AND rating <= 5)
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  pros: text('pros').array(),
  cons: text('cons').array(),

  // Service quality ratings (all CHECK >= 1 AND <= 5)
  timelinessRating: integer('timeliness_rating'),
  qualityRating: integer('quality_rating'),
  communicationRating: integer('communication_rating'),

  // Response from repairer
  repairerResponse: text('repairer_response'),
  repairerResponseDate: timestamp('repairer_response_date', { withTimezone: true, mode: 'string' }),

  // Status
  isVerified: boolean('is_verified').default(false),
  isPublic: boolean('is_public').default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_repairer_reviews_repairer_id').on(table.repairerId),
  index('idx_repairer_reviews_customer_id').on(table.customerId),
  index('idx_repairer_reviews_rating').on(table.rating),
  uniqueIndex('repairer_reviews_repairer_customer_appointment_unique').on(table.repairerId, table.customerId, table.appointmentId),
])

export type RepairerReview = typeof repairerReviews.$inferSelect
export type NewRepairerReview = typeof repairerReviews.$inferInsert

// =============================================================================
// REPAIRER APPLICATIONS
// =============================================================================
// Applications from users to become repairers (pending admin approval).
// From 003_comprehensive_schema_enhancement.sql.
// CHECK (business_type IN ('individual', 'business', 'organization'))
// CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes'))
// UNIQUE (user_id)

export const repairerApplications = pgTable('technician_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Business information
  businessName: text('business_name'),
  // CHECK (business_type IN ('individual', 'business', 'organization'))
  businessType: varchar('business_type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  yearsExperience: integer('years_experience').default(0),

  // Contact
  phone: varchar('phone', { length: 50 }).notNull(),
  website: varchar('website', { length: 255 }),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),

  // Service area
  serviceRadiusKm: integer('service_radius_km').default(50),
  remoteServices: boolean('remote_services').notNull().default(false),

  // Pricing
  hourlyRateCents: integer('hourly_rate_cents'),
  emergencyFeeCents: integer('emergency_fee_cents'),
  homeVisitFeeCents: integer('home_visit_fee_cents'),

  // Skills
  servicesOffered: text('services_offered').array().default([]),
  specializations: text('specializations').array().default([]),
  certifications: jsonb('certifications').default([]),
  insuranceInfo: text('insurance_info'),

  // Documents
  portfolioImages: text('portfolio_images').array().default([]),
  verificationDocuments: text('verification_documents').array().default([]),

  // Terms
  termsAccepted: boolean('terms_accepted').notNull().default(false),

  // Status — CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes'))
  status: varchar('status', { length: 20 }).notNull().default('pending'),

  // Admin review
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_repairer_applications_user_id').on(table.userId),
  index('idx_repairer_applications_status').on(table.status),
])

export type RepairerApplication = typeof repairerApplications.$inferSelect
export type NewRepairerApplication = typeof repairerApplications.$inferInsert

// =============================================================================
// SKIPPED TABLES (referenced in TABLE_NAMES but no migration exists):
//   - repairer_certifications
//   - certification_types
//   - document_types
//   - verification_documents
// =============================================================================
