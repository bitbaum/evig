import { pgTable, uuid, text, boolean, timestamp, integer, varchar, date, time, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// WORKSHOPS
// =============================================================================
// Workshop definitions managed by admins.
// Final state: 001 + 038 (short_description, duration_minutes, min_participants,
// prerequisites, learning_objectives, target_audience, materials_provided,
// materials_required, featured_image, instructor_id, created_by, updated_by).

export const workshops = pgTable('workshops', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  duration: text('duration'),
  level: text('level'),
  maxParticipants: integer('max_participants').default(12),
  priceCents: integer('price_cents').default(0),
  isActive: boolean('is_active').default(true),

  // Added by 038: fields for proposal-to-workshop conversion
  shortDescription: text('short_description'),
  durationMinutes: integer('duration_minutes'),
  minParticipants: integer('min_participants').default(3),
  prerequisites: text('prerequisites'),
  learningObjectives: text('learning_objectives').array().default([]),
  targetAudience: text('target_audience'),
  materialsProvided: text('materials_provided'),
  materialsRequired: text('materials_required'),
  featuredImage: text('featured_image'),
  instructorId: uuid('instructor_id').references(() => users.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_workshops_instructor').on(table.instructorId),
  index('idx_workshops_created_by').on(table.createdBy),
])

export type Workshop = typeof workshops.$inferSelect
export type NewWorkshop = typeof workshops.$inferInsert

// =============================================================================
// WORKSHOP INSTANCES (specific dates/sessions)
// =============================================================================
// Final state: 001 + 038 (location_details, instructor_id).
// CHECK (status IN ('scheduled', 'cancelled', 'completed'))

export const workshopInstances = pgTable('workshop_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date', { withTimezone: true, mode: 'string' }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true, mode: 'string' }),
  location: text('location').default('RevampIT, Birmensdorferstr. 379, 8055 Zürich'),
  instructor: text('instructor'),
  maxParticipants: integer('max_participants'),
  notes: text('notes'),
  // CHECK (status IN ('scheduled', 'cancelled', 'completed'))
  status: text('status').default('scheduled'),

  // Added by 038: instance-level overrides
  locationDetails: text('location_details'),
  instructorId: uuid('instructor_id').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_workshop_instances_workshop_id').on(table.workshopId),
  index('idx_workshop_instances_instructor').on(table.instructorId),
])

export type WorkshopInstance = typeof workshopInstances.$inferSelect
export type NewWorkshopInstance = typeof workshopInstances.$inferInsert

// =============================================================================
// WORKSHOP REGISTRATIONS
// =============================================================================
// User registrations for workshop instances.
// From 001-unified-auth.sql.
// UNIQUE (user_id, workshop_instance_id)
// CHECK (status IN ('pending', 'confirmed', 'waitlist', 'attended', 'cancelled', 'no_show'))
// CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded'))
// CHECK (rating >= 1 AND rating <= 5)

export const workshopRegistrations = pgTable('workshop_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workshopInstanceId: uuid('workshop_instance_id').notNull().references(() => workshopInstances.id, { onDelete: 'cascade' }),

  // CHECK (status IN ('pending', 'confirmed', 'waitlist', 'attended', 'cancelled', 'no_show'))
  status: text('status').default('pending'),

  // Payment (if applicable)
  // CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded'))
  paymentStatus: text('payment_status').default('not_required'),
  paymentAmountCents: integer('payment_amount_cents'),
  paymentReference: text('payment_reference'),

  // Feedback
  attended: boolean('attended').default(false),
  // CHECK (rating >= 1 AND rating <= 5)
  rating: integer('rating'),
  feedback: text('feedback'),

  // Admin
  notes: text('notes'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_workshop_registrations_user_id').on(table.userId),
  index('idx_workshop_registrations_instance_id').on(table.workshopInstanceId),
  uniqueIndex('workshop_registrations_user_instance_unique').on(table.userId, table.workshopInstanceId),
])

export type WorkshopRegistration = typeof workshopRegistrations.$inferSelect
export type NewWorkshopRegistration = typeof workshopRegistrations.$inferInsert

// =============================================================================
// WORKSHOP PROPOSALS
// =============================================================================
// User-submitted workshop ideas for admin review.
// From 016_workshop_proposals.sql.
// CHECK (level IN ('beginner', 'intermediate', 'advanced'))
// CHECK (location_type IN ('venue', 'online', 'home'))
// CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes'))

export const workshopProposals = pgTable('workshop_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  category: varchar('category', { length: 100 }),
  durationMinutes: integer('duration_minutes').notNull(),
  // CHECK (level IN ('beginner', 'intermediate', 'advanced'))
  level: varchar('level', { length: 20 }).notNull().default('beginner'),
  maxParticipants: integer('max_participants').notNull().default(10),
  minParticipants: integer('min_participants').notNull().default(3),
  priceCents: integer('price_cents').notNull().default(0),
  prerequisites: text('prerequisites'),
  learningObjectives: text('learning_objectives').array().default([]),
  targetAudience: text('target_audience'),
  materialsProvided: text('materials_provided'),
  materialsRequired: text('materials_required'),
  // CHECK (location_type IN ('venue', 'online', 'home'))
  locationType: varchar('location_type', { length: 20 }).notNull().default('venue'),
  selectedLocationId: uuid('selected_location_id'),
  proposedLocation: text('proposed_location'),
  proposedDate: date('proposed_date'),
  proposedTime: time('proposed_time'),
  specialRequirements: text('special_requirements'),
  termsAccepted: boolean('terms_accepted').notNull().default(false),

  // Review status — CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes'))
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  // Added by 034: admin edit tracking
  editHistory: jsonb('edit_history').default([]),
  lastEditedBy: uuid('last_edited_by').references(() => users.id, { onDelete: 'set null' }),
  lastEditedAt: timestamp('last_edited_at', { withTimezone: true, mode: 'string' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_workshop_proposals_user').on(table.userId),
  index('idx_workshop_proposals_status').on(table.status),
  index('idx_workshop_proposals_category').on(table.category),
  index('idx_workshop_proposals_created').on(table.createdAt),
])

export type WorkshopProposal = typeof workshopProposals.$inferSelect
export type NewWorkshopProposal = typeof workshopProposals.$inferInsert

// =============================================================================
// WORKSHOP MATERIALS
// =============================================================================
// Materials (PDFs, documents, links) shared with workshop participants.
// From 011_workshop_materials.sql.
// CHECK (material_type IN ('pdf', 'document', 'link', 'video', 'archive'))
// CHECK (access_type IN ('public', 'registered', 'attended'))

export const workshopMaterials = pgTable('workshop_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  instanceId: uuid('instance_id').references(() => workshopInstances.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  // CHECK (material_type IN ('pdf', 'document', 'link', 'video', 'archive'))
  materialType: varchar('material_type', { length: 50 }).notNull(),
  url: text('url').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  // CHECK (access_type IN ('public', 'registered', 'attended'))
  accessType: varchar('access_type', { length: 20 }).default('registered'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_workshop_materials_workshop').on(table.workshopId),
  index('idx_workshop_materials_instance').on(table.instanceId),
  index('idx_workshop_materials_active').on(table.isActive),
])

export type WorkshopMaterial = typeof workshopMaterials.$inferSelect
export type NewWorkshopMaterial = typeof workshopMaterials.$inferInsert
