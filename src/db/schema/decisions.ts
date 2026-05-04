import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// DECISIONS (standalone team decisions & voting)
// =============================================================================

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  // Background/rationale — the "why" context voters can read before voting (nullable)
  background: text('background'),

  // Category (Verein)
  category: text('category').default('operativ'),

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

  // Participant scope: all_staff | board_only | all_members | invited
  participantScope: text('participant_scope').notNull().default('all_staff'),

  // Outcome
  outcome: jsonb('outcome'),
  outcomeSummary: text('outcome_summary'),
  aiOutcomeNarrative: text('ai_outcome_narrative'),
  revealedAt: timestamp('revealed_at', { withTimezone: true, mode: 'string' }),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
  closedBy: uuid('closed_by'),
  cancelReason: text('cancel_reason'),

  // Public voting — when true, anyone with the link can vote (no account needed)
  allowPublicVoting: boolean('allow_public_voting').notNull().default(false),

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
  // Registered voter — null for anonymous votes
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  // Anonymous voter email — null for registered voters; uniqueness enforced via partial index
  voterEmail: text('voter_email'),
  voteData: jsonb('vote_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  // Partial unique indexes (see migration 066): one per identity type
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
