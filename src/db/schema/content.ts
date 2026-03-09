import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// BLOG CATEGORIES
// =============================================================================

export const blogCategories = pgTable('blog_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#16a34a'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type BlogCategory = typeof blogCategories.$inferSelect
export type NewBlogCategory = typeof blogCategories.$inferInsert

// =============================================================================
// BLOG POSTS
// =============================================================================

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  featuredImage: text('featured_image'),
  categoryId: uuid('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  tags: text('tags').array().default([]),

  // Publishing status
  isPublished: boolean('is_published').default(false),
  isFeatured: boolean('is_featured').default(false),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),

  // SEO metadata
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
  index('idx_blog_posts_published').on(table.isPublished),
  index('idx_blog_posts_published_at').on(table.publishedAt),
  index('idx_blog_posts_category').on(table.categoryId),
  index('idx_blog_posts_slug').on(table.slug),
  index('idx_blog_posts_created_by').on(table.createdBy),
])

export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert

// =============================================================================
// BLOG SUBMISSIONS
// =============================================================================
// User-submitted blog content pending admin review.
// Final state includes edit tracking columns from migration 034.
// CHECK (submission_type IN ('idea','draft')) — validated at app layer
// CHECK (status IN ('pending','approved','rejected','published')) — validated at app layer

export const blogSubmissions = pgTable('blog_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Submitter info
  submitterName: text('submitter_name').notNull(),
  submitterEmail: text('submitter_email').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Content
  title: text('title').notNull(),
  slug: text('slug'),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  submissionType: text('submission_type').notNull().default('draft'),

  // Categorization
  categoryId: uuid('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name'),
  tags: text('tags').array().default([]),

  // Status workflow
  status: text('status').notNull().default('pending'),

  // Review info
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),

  // Link to published post
  publishedPostId: uuid('published_post_id').references(() => blogPosts.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),

  // Edit tracking (added by 034)
  editHistory: jsonb('edit_history').default([]),
  lastEditedBy: uuid('last_edited_by').references(() => users.id, { onDelete: 'set null' }),
  lastEditedAt: timestamp('last_edited_at', { withTimezone: true, mode: 'string' }),

  // Timestamps
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_blog_submissions_status').on(table.status),
  index('idx_blog_submissions_submitted_at').on(table.submittedAt),
  index('idx_blog_submissions_submitter_email').on(table.submitterEmail),
  index('idx_blog_submissions_last_edited').on(table.lastEditedAt),
  index('idx_blog_submissions_edited_by').on(table.lastEditedBy),
])

export type BlogSubmission = typeof blogSubmissions.$inferSelect
export type NewBlogSubmission = typeof blogSubmissions.$inferInsert

// =============================================================================
// STATIC PAGES
// =============================================================================

export const staticPages = pgTable('static_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),

  // SEO
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  // Publishing
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
  index('idx_static_pages_slug').on(table.slug),
  index('idx_static_pages_published').on(table.isPublished),
])

export type StaticPage = typeof staticPages.$inferSelect
export type NewStaticPage = typeof staticPages.$inferInsert

// =============================================================================
// CATEGORIES
// =============================================================================
// Referenced in TABLE_NAMES but no migration found — skip.
// The 'categories' concept exists only in config constants (shop, workshop, etc.),
// not as a standalone database table.
