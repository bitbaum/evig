import { pgTable, uuid, text, jsonb, timestamp, date, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { tasks } from './tasks'
import { teams } from './teams'
import { decisions } from './decisions'

// =============================================================================
// MEETING PROTOCOLS
// =============================================================================
// Meeting minutes with AI-processed structured notes.
// Final state includes input_method from migration 027; all enum CHECKs
// dropped in migration 134 (values validated via zod from src/config/protocols.ts).

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
  // Optional owning team (134) — surfaces the protocol on the team space page.
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_protocols_meeting_date').on(table.meetingDate),
  index('idx_protocols_meeting_type').on(table.meetingType),
  index('idx_protocols_status').on(table.status),
  index('idx_protocols_created_by').on(table.createdBy),
  index('idx_protocols_team').on(table.teamId),
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
