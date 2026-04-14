import { pgTable, text, numeric, date, timestamp, index } from 'drizzle-orm/pg-core'

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
