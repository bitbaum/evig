import { pgTable, uuid, text, timestamp, index, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

/**
 * Someone asked for admin from Einstellungen. An existing admin confirms.
 * One open request per person. grant_level is what the confirmer chose.
 */
export const adminAccessRequests = pgTable(
  'admin_access_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'),
    grantLevel: text('grant_level'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    index('idx_admin_access_requests_user').on(table.userId),
    index('idx_admin_access_requests_status').on(table.status),
    uniqueIndex('admin_access_requests_one_pending')
      .on(table.userId)
      .where(sql`${table.status} = 'pending'`),
    check(
      'admin_access_requests_status_valid',
      sql`${table.status} IN ('pending', 'approved', 'rejected')`,
    ),
    check(
      'admin_access_requests_level_valid',
      sql`${table.grantLevel} IS NULL OR ${table.grantLevel} IN ('staff', 'admin')`,
    ),
  ],
);

export type AdminAccessRequest = typeof adminAccessRequests.$inferSelect;
export type NewAdminAccessRequest = typeof adminAccessRequests.$inferInsert;
