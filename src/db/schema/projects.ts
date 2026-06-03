import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { taskProjects } from './tasks'

// =============================================================================
// PROJECTS — public projects registry (bridges /projects pages ↔ task_projects)
// =============================================================================

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  taskProjectId: uuid('task_project_id').references(() => taskProjects.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_projects_slug').on(table.slug),
])

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

// =============================================================================
// PROJECT NEEDS — typed asks per project (open/matched/fulfilled/archived)
// =============================================================================
// CHECK (type IN ('expertise','hardware','partner_intro','funding','volunteer_time')) — app layer
// CHECK (status IN ('open','matched','fulfilled','archived')) — app layer

export const projectNeeds = pgTable('project_needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetQuantity: integer('target_quantity'),
  targetUnit: text('target_unit'),
  status: text('status').notNull().default('open'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_project_needs_project').on(table.projectId),
])

export type ProjectNeed = typeof projectNeeds.$inferSelect
export type NewProjectNeed = typeof projectNeeds.$inferInsert

// =============================================================================
// PROJECT CONTRIBUTIONS — inbound offers from visitors, triaged by staff
// =============================================================================
// CHECK (status IN ('new','contacted','accepted','declined')) — app layer

export const projectContributions = pgTable('project_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  needId: uuid('need_id').references(() => projectNeeds.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  organization: text('organization'),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'),
  internalNotes: text('internal_notes'),
  respondedBy: uuid('responded_by').references(() => users.id, { onDelete: 'set null' }),
  respondedAt: timestamp('responded_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_project_contributions_project').on(table.projectId),
  index('idx_project_contributions_need').on(table.needId),
  index('idx_project_contributions_status').on(table.status),
])

export type ProjectContribution = typeof projectContributions.$inferSelect
export type NewProjectContribution = typeof projectContributions.$inferInsert
