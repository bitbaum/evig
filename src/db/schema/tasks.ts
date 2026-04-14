import { pgTable, uuid, text, date, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

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
