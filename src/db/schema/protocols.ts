import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { tasks } from './tasks'
import { decisions } from './decisions'

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
