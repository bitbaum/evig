import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  date,
  jsonb,
  index,
  varchar,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { teamProfiles } from './team'

export const jobPostings = pgTable(
  'job_postings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    title: varchar('title', { length: 200 }).notNull(),
    summary: text('summary'),
    description: text('description').notNull(),
    roleTrack: varchar('role_track', { length: 30 }).notNull(),
    department: varchar('department', { length: 50 }),
    location: varchar('location', { length: 200 }),
    remoteOk: boolean('remote_ok').notNull().default(false),
    hoursPerWeek: integer('hours_per_week'),
    startDate: date('start_date', { mode: 'string' }),
    applicationDeadline: timestamp('application_deadline', { withTimezone: true, mode: 'string' }),
    compensationPublicText: text('compensation_public_text'),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    frozenAt: timestamp('frozen_at', { withTimezone: true, mode: 'string' }),
    filledAt: timestamp('filled_at', { withTimezone: true, mode: 'string' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    hiringManagerUserId: uuid('hiring_manager_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    showOnGetInvolved: boolean('show_on_get_involved').notNull().default(true),
    seoTitle: varchar('seo_title', { length: 200 }),
    seoDescription: varchar('seo_description', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_job_postings_status').on(table.status),
    index('idx_job_postings_role_track').on(table.roleTrack),
    check(
      'job_postings_role_track_valid',
      sql`${table.roleTrack} IN ('volunteer', 'intern', 'employee', 'reintegration', 'contractor')`,
    ),
    check(
      'job_postings_status_valid',
      sql`${table.status} IN ('draft', 'published', 'frozen', 'filled', 'closed', 'archived')`,
    ),
  ],
)

export const jobApplications = pgTable(
  'job_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobPostingId: uuid('job_posting_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    applicantName: varchar('applicant_name', { length: 200 }).notNull(),
    applicantEmail: varchar('applicant_email', { length: 320 }).notNull(),
    applicantPhone: varchar('applicant_phone', { length: 50 }),
    locale: varchar('locale', { length: 10 }).default('de'),
    status: varchar('status', { length: 30 }).notNull().default('new'),
    trackResponses: jsonb('track_responses').notNull().default({}),
    cvStorageKey: text('cv_storage_key'),
    attachments: jsonb('attachments').default([]),
    source: varchar('source', { length: 30 }).notNull().default('website'),
    adminNotes: text('admin_notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    rejectionReason: text('rejection_reason'),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true, mode: 'string' }),
    hiredTeamProfileId: uuid('hired_team_profile_id').references(() => teamProfiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_job_applications_posting').on(table.jobPostingId),
    index('idx_job_applications_status').on(table.status),
    check(
      'job_applications_status_valid',
      sql`${table.status} IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')`,
    ),
  ],
)

export const jobApplicationEvents = pgTable(
  'job_application_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => jobApplications.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    payload: jsonb('payload').default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_job_application_events_app').on(table.applicationId, table.createdAt)],
)

export type JobPosting = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert
export type JobApplication = typeof jobApplications.$inferSelect
export type NewJobApplication = typeof jobApplications.$inferInsert
