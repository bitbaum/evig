import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// STORAGE LOCATIONS
// =============================================================================
// WHERE a physical inventory item sits. Runtime-addable (staff add a location
// from the erfassung picker). Distinct from the public `locations` table
// (workshop/service venues). Created in 117_storage_locations.sql.
//
// `kind` is validated at the app layer against STORAGE_LOCATION_KINDS
// (src/config/erfassung/storage-locations.ts) — no SQL CHECK (per migration-110
// policy: app enums live in config + zod, not DB constraints).

export const storageLocations = pgTable('storage_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('other'),
  // For kind = 'member_possession': which team member currently holds the item.
  holderUserId: uuid('holder_user_id').references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_storage_locations_active').on(table.isActive),
  index('idx_storage_locations_kind').on(table.kind),
])

export type StorageLocation = typeof storageLocations.$inferSelect
export type NewStorageLocation = typeof storageLocations.$inferInsert
