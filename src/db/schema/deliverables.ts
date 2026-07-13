import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { tasks } from './tasks'

/** A downloadable/viewable file, served from public/. */
export interface DeliverableFile {
  name: string
  url: string
}

// =============================================================================
// DELIVERABLES
// =============================================================================
// Delivered artifacts (report / presentation / mockup / document / link).
// Enums (type/status/visibility) live in src/config/deliverables.ts + zod —
// the columns are plain text with NO CHECK constraint (per CLAUDE.md §DB).

export const deliverables = pgTable('deliverables', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('other'),
  /** Rendering the recipient opens: public path, R2 file URL, external link, or git source path. */
  url: text('url'),
  /** Editable, versioned source — its deliverables/<slug>/ git folder. Powers the agent brief. */
  sourcePath: text('source_path'),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('draft'),
  visibility: text('visibility').notNull().default('team'),
  /** Unguessable external share link (null = not shared externally). */
  shareToken: text('share_token').unique(),
  currentVersion: integer('current_version').notNull().default(1),
  /** Downloadable/viewable files served from public/ — [{ name, url }]. */
  files: jsonb('files').$type<DeliverableFile[]>().notNull().default([]),
  deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_deliverables_owner').on(table.ownerUserId),
  index('idx_deliverables_status').on(table.status),
  index('idx_deliverables_type').on(table.type),
  index('idx_deliverables_task').on(table.taskId),
])

export type Deliverable = typeof deliverables.$inferSelect
export type NewDeliverable = typeof deliverables.$inferInsert

// =============================================================================
// DELIVERABLE FEEDBACK
// =============================================================================
// A thread of feedback items: comment / change_request / approval.
// External (share-link) reviewers have NULL authorUserId + an authorName.

export const deliverableFeedback = pgTable('deliverable_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliverableId: uuid('deliverable_id').notNull().references(() => deliverables.id, { onDelete: 'cascade' }),
  authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Display name for external (no-login) reviewers. */
  authorName: text('author_name'),
  kind: text('kind').notNull().default('comment'),
  /** Which part of the deliverable a change_request targets (free text). */
  target: text('target'),
  body: text('body').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_deliverable_feedback_del').on(table.deliverableId),
  index('idx_deliverable_feedback_st').on(table.status),
])

export type DeliverableFeedback = typeof deliverableFeedback.$inferSelect
export type NewDeliverableFeedback = typeof deliverableFeedback.$inferInsert
