import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, varchar, numeric, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
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

// =============================================================================
// NEWSLETTER SUBSCRIPTIONS
// =============================================================================
// Final state: original 001 + confirm_token from 042.

export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Preferences
  frequency: text('frequency').default('monthly'),
  topics: text('topics').array(),
  language: text('language').default('de'),

  // Status
  isActive: boolean('is_active').default(true),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'string' }),

  // Tracking
  source: text('source'),

  // Email confirmation token (added by 042)
  confirmToken: text('confirm_token'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_newsletter_subscriptions_email').on(table.email),
  index('idx_newsletter_subscriptions_confirm_token').on(table.confirmToken),
])

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert

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
// ORG NUMBERS (shared organizational metrics SSOT)
// =============================================================================
// Uses TEXT primary key (not UUID). Both revampit and revamp-info share this table.

export const orgNumbers = pgTable('org_numbers', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  numericValue: numeric('numeric_value'),
  label: text('label').notNull(),
  // CHECK (category IN ('impact','social','economic','operations')) — validated at app layer
  category: text('category').notNull(),
  // CHECK (confidence IN ('high','medium','estimated','target')) — validated at app layer
  confidence: text('confidence').notNull(),
  methodology: text('methodology'),
  calculation: text('calculation'),
  sourceDocument: text('source_document'),
  externalLink: text('external_link'),
  lastVerified: date('last_verified', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_org_numbers_category').on(table.category),
])

export type OrgNumber = typeof orgNumbers.$inferSelect
export type NewOrgNumber = typeof orgNumbers.$inferInsert

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

// =============================================================================
// TASK PROJECTS
// =============================================================================
// Groups related tasks into projects.

export const taskProjects = pgTable('task_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  // CHECK (status IN ('planning','active','on_hold','completed','cancelled')) — validated at app layer
  status: text('status').notNull().default('planning'),
  targetDate: date('target_date', { mode: 'string' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type TaskProject = typeof taskProjects.$inferSelect
export type NewTaskProject = typeof taskProjects.$inferInsert

// =============================================================================
// TASKS
// =============================================================================
// Self-reporting task management system.
// CHECK constraints on task_type, category, priority, current_status — validated at app layer

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  taskType: text('task_type').notNull(),
  scheduleCron: text('schedule_cron'),
  scheduleHuman: text('schedule_human'),
  category: text('category').notNull(),
  tags: text('tags').array().default([]),
  priority: text('priority').notNull().default('normal'),
  estimatedMinutes: integer('estimated_minutes'),
  dueDate: date('due_date', { mode: 'string' }),
  currentStatus: text('current_status').notNull().default('idle'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  completedBy: uuid('completed_by').references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  projectId: uuid('project_id').references(() => taskProjects.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_tasks_status').on(table.currentStatus),
  index('idx_tasks_category').on(table.category),
  index('idx_tasks_type').on(table.taskType),
  index('idx_tasks_project').on(table.projectId),
  index('idx_tasks_assigned_to').on(table.assignedTo),
])

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

// =============================================================================
// TASK COMPLETIONS
// =============================================================================
// History of who completed what and when.

export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  completedBy: uuid('completed_by').notNull().references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  notes: text('notes'),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_task_completions_task').on(table.taskId),
  index('idx_task_completions_user').on(table.completedBy),
  index('idx_task_completions_date').on(table.completedAt),
])

export type TaskCompletion = typeof taskCompletions.$inferSelect
export type NewTaskCompletion = typeof taskCompletions.$inferInsert

// =============================================================================
// TASK ATTENTION FLAGS
// =============================================================================
// Flags for tasks needing urgent attention.

export const taskAttentionFlags = pgTable('task_attention_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  flaggedBy: uuid('flagged_by').notNull().references(() => users.id),
  message: text('message'),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
  resolvedByCompletionId: uuid('resolved_by_completion_id').references(() => taskCompletions.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_task_attention_flags_task').on(table.taskId),
])

export type TaskAttentionFlag = typeof taskAttentionFlags.$inferSelect
export type NewTaskAttentionFlag = typeof taskAttentionFlags.$inferInsert

// =============================================================================
// TASK REQUESTS
// =============================================================================
// Requests to specific users or broadcasts to all staff.
// is_broadcast is a generated column: true when requested_user_id IS NULL.

export const taskRequests = pgTable('task_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  requestedUserId: uuid('requested_user_id').references(() => users.id),
  // GENERATED ALWAYS AS (requested_user_id IS NULL) STORED
  isBroadcast: boolean('is_broadcast').generatedAlwaysAs(sql`requested_user_id IS NULL`),
  message: text('message'),
  // CHECK (status IN ('pending','accepted','declined','completed')) — validated at app layer
  status: text('status').notNull().default('pending'),
  responseMessage: text('response_message'),
  completionId: uuid('completion_id').references(() => taskCompletions.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_task_requests_user').on(table.requestedUserId),
  index('idx_task_requests_broadcast').on(table.isBroadcast),
])

export type TaskRequest = typeof taskRequests.$inferSelect
export type NewTaskRequest = typeof taskRequests.$inferInsert

// =============================================================================
// MEETING PROTOCOLS
// =============================================================================
// Meeting minutes with AI-processed structured notes.
// Final state includes input_method from migration 027.

export const meetingProtocols = pgTable('meeting_protocols', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  meetingDate: date('meeting_date', { mode: 'string' }).notNull(),
  // CHECK (meeting_type IN ('team_weekly','project_review','retro','board','ad_hoc')) — validated at app layer
  meetingType: text('meeting_type').notNull(),
  // CHECK (visibility IN ('team','attendees')) — validated at app layer
  visibility: text('visibility').notNull().default('team'),
  attendees: jsonb('attendees').default([]),
  rawTranscript: text('raw_transcript'),
  structuredNotes: jsonb('structured_notes'),
  processingModel: text('processing_model'),
  // CHECK (status IN ('draft','processing','review','finalized')) — validated at app layer
  status: text('status').notNull().default('draft'),
  // CHECK (input_method IN ('audio','transcript','notes','tasks')) — validated at app layer
  inputMethod: text('input_method').default('transcript'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_protocols_meeting_date').on(table.meetingDate),
  index('idx_protocols_meeting_type').on(table.meetingType),
  index('idx_protocols_status').on(table.status),
  index('idx_protocols_created_by').on(table.createdBy),
])

export type MeetingProtocol = typeof meetingProtocols.$inferSelect
export type NewMeetingProtocol = typeof meetingProtocols.$inferInsert

// =============================================================================
// PROTOCOL ACTION LINKS
// =============================================================================
// Links between protocol action items and tasks/decisions.
// FK to decisions added by migration 028.

export const protocolActionLinks = pgTable('protocol_action_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolId: uuid('protocol_id').notNull().references(() => meetingProtocols.id, { onDelete: 'cascade' }),
  actionItemId: text('action_item_id').notNull(),
  // CHECK (link_type IN ('task','decision')) — validated at app layer
  linkType: text('link_type').notNull(),
  linkedTaskId: uuid('linked_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  linkedDecisionId: uuid('linked_decision_id').references(() => decisions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_protocol_action_links_protocol').on(table.protocolId),
  index('idx_protocol_action_links_decision_id').on(table.linkedDecisionId),
])

export type ProtocolActionLink = typeof protocolActionLinks.$inferSelect
export type NewProtocolActionLink = typeof protocolActionLinks.$inferInsert

// =============================================================================
// PROTOCOL DECISION VOTES
// =============================================================================
// Individual votes on protocol decision items (thumbs up/down).

export const protocolDecisionVotes = pgTable('protocol_decision_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolId: uuid('protocol_id').notNull().references(() => meetingProtocols.id, { onDelete: 'cascade' }),
  actionItemId: text('action_item_id').notNull(),
  voterId: uuid('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // CHECK (vote_type IN ('up','down')) — validated at app layer
  voteType: text('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('protocol_decision_votes_protocol_id_action_item_id_voter_id_key')
    .on(table.protocolId, table.actionItemId, table.voterId),
  index('idx_protocol_decision_votes_protocol').on(table.protocolId),
  index('idx_protocol_decision_votes_action').on(table.protocolId, table.actionItemId),
])

export type ProtocolDecisionVote = typeof protocolDecisionVotes.$inferSelect
export type NewProtocolDecisionVote = typeof protocolDecisionVotes.$inferInsert

// =============================================================================
// PROTOCOL DECISION OUTCOMES
// =============================================================================
// Aggregated decision state, AI proposals, and task creation tracking.

export const protocolDecisionOutcomes = pgTable('protocol_decision_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolId: uuid('protocol_id').notNull().references(() => meetingProtocols.id, { onDelete: 'cascade' }),
  actionItemId: text('action_item_id').notNull(),
  isClosed: boolean('is_closed').notNull().default(false),
  closedBy: uuid('closed_by').references(() => users.id),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
  // CHECK (result IN ('approved','rejected','pending')) — validated at app layer
  result: text('result').notNull().default('pending'),
  votesUp: integer('votes_up').notNull().default(0),
  votesDown: integer('votes_down').notNull().default(0),
  proposedTasks: jsonb('proposed_tasks'),
  proposalModel: text('proposal_model'),
  tasksCreated: boolean('tasks_created').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('protocol_decision_outcomes_protocol_id_action_item_id_key')
    .on(table.protocolId, table.actionItemId),
  index('idx_protocol_decision_outcomes_protocol').on(table.protocolId),
])

export type ProtocolDecisionOutcome = typeof protocolDecisionOutcomes.$inferSelect
export type NewProtocolDecisionOutcome = typeof protocolDecisionOutcomes.$inferInsert

// =============================================================================
// DECISIONS (standalone team decisions & voting)
// =============================================================================

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),

  // Type & method
  decisionType: text('decision_type').notNull(),
  votingMethod: text('voting_method').notNull(),

  // Options for voting (JSON array of { id, label, description })
  options: jsonb('options').notNull().default([]),

  // Quorum config (JSON: { type, value })
  quorum: jsonb('quorum').notNull().default({ type: 'percentage', value: 50 }),

  blindVoting: boolean('blind_voting').notNull().default(true),
  dotCount: integer('dot_count'),

  // Participants (JSON array of user IDs)
  invitedParticipants: jsonb('invited_participants').notNull().default([]),

  // Status workflow: draft -> discussion -> voting -> closed | cancelled
  status: text('status').notNull().default('draft'),

  // Deadlines
  discussionDeadline: timestamp('discussion_deadline', { withTimezone: true, mode: 'string' }),
  votingDeadline: timestamp('voting_deadline', { withTimezone: true, mode: 'string' }),

  // Outcome
  outcome: jsonb('outcome'),
  outcomeSummary: text('outcome_summary'),
  revealedAt: timestamp('revealed_at', { withTimezone: true, mode: 'string' }),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
  closedBy: uuid('closed_by'),
  cancelReason: text('cancel_reason'),

  // Creator
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_decisions_status').on(table.status),
  index('idx_decisions_created_by').on(table.createdBy),
  index('idx_decisions_voting_deadline').on(table.votingDeadline),
])

export type Decision = typeof decisions.$inferSelect
export type NewDecision = typeof decisions.$inferInsert

// =============================================================================
// DECISION VOTES
// =============================================================================

export const decisionVotes = pgTable('decision_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteData: jsonb('vote_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('decision_votes_decision_id_user_id_key')
    .on(table.decisionId, table.userId),
  index('idx_decision_votes_decision_id').on(table.decisionId),
  index('idx_decision_votes_user_id').on(table.userId),
])

export type DecisionVote = typeof decisionVotes.$inferSelect
export type NewDecisionVote = typeof decisionVotes.$inferInsert

// =============================================================================
// DECISION COMMENTS
// =============================================================================

export const decisionComments = pgTable('decision_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  position: text('position').notNull(),
  optionId: text('option_id'),
  parentCommentId: uuid('parent_comment_id'),
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_decision_comments_decision_id').on(table.decisionId),
  index('idx_decision_comments_user_id').on(table.userId),
])

export type DecisionComment = typeof decisionComments.$inferSelect
export type NewDecisionComment = typeof decisionComments.$inferInsert

// =============================================================================
// SUBSCRIPTION POOLS
// =============================================================================
// Subscription Exchange (Abo-Tauschborse).
// cost_per_member_chf is a generated column (monthly_cost_chf / max_members).

export const subscriptionPools = pgTable('subscription_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceName: text('service_name').notNull(),
  serviceCategory: text('service_category').notNull().default('other'),
  maxMembers: integer('max_members').notNull(),
  monthlyCostChf: decimal('monthly_cost_chf', { precision: 10, scale: 2 }).notNull(),
  // GENERATED ALWAYS AS (monthly_cost_chf / max_members) STORED
  costPerMemberChf: decimal('cost_per_member_chf', { precision: 10, scale: 2 }).generatedAlwaysAs(sql`monthly_cost_chf / max_members`),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  status: text('status').notNull().default('active'),
  description: text('description'),
  rules: text('rules'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_subscription_pools_status').on(table.status),
])

export type SubscriptionPool = typeof subscriptionPools.$inferSelect
export type NewSubscriptionPool = typeof subscriptionPools.$inferInsert

// =============================================================================
// POOL MEMBERSHIPS
// =============================================================================

export const poolMemberships = pgTable('pool_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  uniqueIndex('pool_memberships_pool_id_user_id_key').on(table.poolId, table.userId),
  index('idx_pool_memberships_user').on(table.userId),
  index('idx_pool_memberships_pool').on(table.poolId),
])

export type PoolMembership = typeof poolMemberships.$inferSelect
export type NewPoolMembership = typeof poolMemberships.$inferInsert

// =============================================================================
// POOL CONTRIBUTIONS
// =============================================================================

export const poolContributions = pgTable('pool_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  amountChf: decimal('amount_chf', { precision: 10, scale: 2 }).notNull(),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  status: text('status').notNull().default('pending'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_pool_contributions_pool').on(table.poolId),
  index('idx_pool_contributions_status').on(table.status),
])

export type PoolContribution = typeof poolContributions.$inferSelect
export type NewPoolContribution = typeof poolContributions.$inferInsert

// =============================================================================
// POOL VOTES (governance)
// =============================================================================

export const poolVotes = pgTable('pool_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  voterId: uuid('voter_id').notNull().references(() => users.id),
  voteType: text('vote_type').notNull(),
  vote: text('vote').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('pool_votes_pool_id_voter_id_vote_type_key')
    .on(table.poolId, table.voterId, table.voteType),
])

export type PoolVote = typeof poolVotes.$inferSelect
export type NewPoolVote = typeof poolVotes.$inferInsert
