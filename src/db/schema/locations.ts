import { pgTable, uuid, varchar, text, decimal, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// LOCATIONS (workshop/service venues)
// =============================================================================
// Created in 016_workshop_proposals.sql.

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  // CHECK (type IN ('venue','home','online','community_center','business')) — validated at app layer
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),

  // Address
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  postalCode: varchar('postal_code', { length: 10 }),
  city: varchar('city', { length: 100 }).notNull(),
  canton: varchar('canton', { length: 50 }),
  country: varchar('country', { length: 100 }).default('Switzerland'),

  // Geographic coordinates
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  // Capacity and facilities
  maxCapacity: integer('max_capacity'),
  facilities: text('facilities').array().default([]),

  // Contact information
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),

  // Accessibility
  accessibilityInfo: jsonb('accessibility_info').default({}),

  // Status
  isActive: boolean('is_active').default(true),
  isApproved: boolean('is_approved').default(false),

  // Approval and moderation
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
  rejectionReason: text('rejection_reason'),

  // Usage statistics
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),

  // Metadata
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_locations_city').on(table.city),
  index('idx_locations_type').on(table.type),
  index('idx_locations_active').on(table.isActive),
])

export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert

// =============================================================================
// LOCATION APPROVALS
// =============================================================================

export const locationApprovals = pgTable('location_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id),
  action: varchar('action', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  reviewNotes: text('review_notes'),
  requiredChanges: text('required_changes').array(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type LocationApproval = typeof locationApprovals.$inferSelect
export type NewLocationApproval = typeof locationApprovals.$inferInsert

// =============================================================================
// LOCATION BOOKINGS
// =============================================================================

export const locationBookings = pgTable('location_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  bookedBy: uuid('booked_by').notNull().references(() => users.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventId: uuid('event_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time', { withTimezone: true, mode: 'string' }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true, mode: 'string' }).notNull(),
  expectedAttendees: integer('expected_attendees'),
  specialRequirements: text('special_requirements'),
  status: varchar('status', { length: 20 }).default('confirmed'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type LocationBooking = typeof locationBookings.$inferSelect
export type NewLocationBooking = typeof locationBookings.$inferInsert
