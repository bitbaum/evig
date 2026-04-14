import { pgTable, uuid, text, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// DONATIONS
// =============================================================================
// Final state: original 001 + device donation columns from 020.
// amount_cents is nullable (device donations may not have a monetary amount).

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Donation details
  amountCents: integer('amount_cents'),
  currency: text('currency').default('CHF'),

  // Payment
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  paymentDate: timestamp('payment_date', { withTimezone: true, mode: 'string' }),

  // Type
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: text('recurring_frequency'),

  // For non-logged-in donors
  donorName: text('donor_name'),
  donorEmail: text('donor_email'),
  donorAddress: text('donor_address'),

  // Tax receipt
  receiptRequested: boolean('receipt_requested').default(false),
  receiptSent: boolean('receipt_sent').default(false),
  receiptSentAt: timestamp('receipt_sent_at', { withTimezone: true, mode: 'string' }),

  // Admin
  notes: text('notes'),
  thankYouSent: boolean('thank_you_sent').default(false),
  thankYouSentAt: timestamp('thank_you_sent_at', { withTimezone: true, mode: 'string' }),

  // Device donation fields (added by 020)
  donationType: text('donation_type').default('monetary'),
  deviceCategory: text('device_category'),
  deviceDescription: text('device_description'),
  deviceBrand: text('device_brand'),
  deviceModel: text('device_model'),
  deviceCondition: text('device_condition'),
  deviceAgeYears: integer('device_age_years'),
  estimatedValueCents: integer('estimated_value_cents'),
  status: text('status').default('recorded'),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_donations_user_id').on(table.userId),
  index('idx_donations_type').on(table.donationType),
  index('idx_donations_status').on(table.status),
  index('idx_donations_created_at').on(table.createdAt),
  index('idx_donations_recorded_by').on(table.recordedBy),
])

export type Donation = typeof donations.$inferSelect
export type NewDonation = typeof donations.$inferInsert
