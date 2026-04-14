import { pgTable, uuid, text, date, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// APPLICATIONS (volunteer, internship, etc.)
// =============================================================================

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Application type
  type: text('type').notNull(),

  // Details
  motivation: text('motivation'),
  availability: text('availability'),
  skills: text('skills').array(),
  experience: text('experience'),
  startDate: date('start_date', { mode: 'string' }),

  // For work reintegration
  referringOrganization: text('referring_organization'),
  caseManagerContact: text('case_manager_contact'),

  // Status workflow
  status: text('status').default('submitted'),

  // Admin handling
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  interviewDate: timestamp('interview_date', { withTimezone: true, mode: 'string' }),
  decisionNotes: text('decision_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_applications_user_id').on(table.userId),
])

export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert

// =============================================================================
// MEMBERSHIP APPLICATIONS (Verein governance)
// =============================================================================

export const membershipApplications = pgTable('membership_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Applicant details
  applicantName: text('applicant_name').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  addressStreet: text('address_street'),
  addressPostalCode: text('address_postal_code'),
  addressCity: text('address_city'),
  birthDate: date('birth_date', { mode: 'string' }),

  // Membership type: 'regular' (CHF 50) or 'reduced' (CHF 20, students/apprentices)
  memberType: text('member_type').default('regular'),
  motivation: text('motivation'),

  // Status workflow: pending → approved/rejected
  status: text('status').default('pending'),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_membership_applications_user_id').on(table.userId),
  index('idx_membership_applications_status').on(table.status),
])

export type MembershipApplication = typeof membershipApplications.$inferSelect
export type NewMembershipApplication = typeof membershipApplications.$inferInsert
