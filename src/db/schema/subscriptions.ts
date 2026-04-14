import { pgTable, uuid, text, decimal, integer, timestamp, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

// =============================================================================
// SUBSCRIPTION POOLS
// =============================================================================
// Subscription Exchange (Abo-Tauschbörse).
// cost_per_member_chf is a generated column (monthly_cost_chf / max_members).

export const subscriptionPools = pgTable('subscription_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceName: text('service_name').notNull(),
  serviceCategory: text('service_category').notNull().default('other'),
  maxMembers: integer('max_members').notNull(),
  monthlyCostChf: decimal('monthly_cost_chf', { precision: 10, scale: 2 }).notNull(),
  // GENERATED ALWAYS AS (monthly_cost_chf / max_members) STORED
  costPerMemberChf: decimal('cost_per_member_chf', { precision: 10, scale: 2 }).generatedAlwaysAs(sql`monthly_cost_chf / max_members`),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  status: text('status').notNull().default('active'),
  description: text('description'),
  rules: text('rules'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_subscription_pools_status').on(table.status),
])

export type SubscriptionPool = typeof subscriptionPools.$inferSelect
export type NewSubscriptionPool = typeof subscriptionPools.$inferInsert

// =============================================================================
// POOL MEMBERSHIPS
// =============================================================================

export const poolMemberships = pgTable('pool_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true, mode: 'string' }),
}, (table) => [
  uniqueIndex('pool_memberships_pool_id_user_id_key').on(table.poolId, table.userId),
  index('idx_pool_memberships_user').on(table.userId),
  index('idx_pool_memberships_pool').on(table.poolId),
])

export type PoolMembership = typeof poolMemberships.$inferSelect
export type NewPoolMembership = typeof poolMemberships.$inferInsert

// =============================================================================
// POOL CONTRIBUTIONS
// =============================================================================

export const poolContributions = pgTable('pool_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  amountChf: decimal('amount_chf', { precision: 10, scale: 2 }).notNull(),
  periodStart: date('period_start', { mode: 'string' }).notNull(),
  periodEnd: date('period_end', { mode: 'string' }).notNull(),
  status: text('status').notNull().default('pending'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_pool_contributions_pool').on(table.poolId),
  index('idx_pool_contributions_status').on(table.status),
])

export type PoolContribution = typeof poolContributions.$inferSelect
export type NewPoolContribution = typeof poolContributions.$inferInsert

// =============================================================================
// POOL VOTES (governance)
// =============================================================================

export const poolVotes = pgTable('pool_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => subscriptionPools.id, { onDelete: 'cascade' }),
  voterId: uuid('voter_id').notNull().references(() => users.id),
  voteType: text('vote_type').notNull(),
  vote: text('vote').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('pool_votes_pool_id_voter_id_vote_type_key')
    .on(table.poolId, table.voterId, table.voteType),
])

export type PoolVote = typeof poolVotes.$inferSelect
export type NewPoolVote = typeof poolVotes.$inferInsert
