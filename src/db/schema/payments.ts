import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, varchar, bigint, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// PAYMENT PROVIDERS
// =============================================================================
// Payment gateway configurations (Stripe, PayPal, etc.).
// From 008_payment_processing_system.sql.
// CHECK (type IN ('stripe', 'paypal', 'bank_transfer', 'crypto'))

export const paymentProviders = pgTable('payment_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  // CHECK (type IN ('stripe', 'paypal', 'bank_transfer', 'crypto'))
  type: varchar('type', { length: 20 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config').default({}),
  supportedCurrencies: text('supported_currencies').array().default(['CHF', 'EUR']),
  testMode: boolean('test_mode').notNull().default(true),
  feePercentage: decimal('fee_percentage', { precision: 5, scale: 4 }).default('0.0000'),
  feeFixedCents: integer('fee_fixed_cents').default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_payment_providers_type').on(table.type),
  index('idx_payment_providers_active').on(table.isActive),
])

export type PaymentProvider = typeof paymentProviders.$inferSelect
export type NewPaymentProvider = typeof paymentProviders.$inferInsert

// =============================================================================
// PAYMENT METHODS (stored customer payment methods)
// =============================================================================
// From 008_payment_processing_system.sql.
// CHECK (type IN ('card', 'sepa', 'paypal', 'bank_account'))

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => paymentProviders.id, { onDelete: 'cascade' }),
  // CHECK (type IN ('card', 'sepa', 'paypal', 'bank_account'))
  type: varchar('type', { length: 20 }).notNull(),
  providerPaymentMethodId: varchar('provider_payment_method_id', { length: 255 }).notNull(),
  lastFour: varchar('last_four', { length: 4 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  cardBrand: varchar('card_brand', { length: 20 }),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_payment_methods_user_id').on(table.userId),
  index('idx_payment_methods_provider').on(table.providerId),
  index('idx_payment_methods_default').on(table.userId, table.isDefault),
  uniqueIndex('payment_methods_user_provider_method_unique').on(table.userId, table.providerPaymentMethodId),
])

export type PaymentMethod = typeof paymentMethods.$inferSelect
export type NewPaymentMethod = typeof paymentMethods.$inferInsert

// =============================================================================
// ORDERS
// =============================================================================
// Order management for marketplace transactions.
// From 007_orders_system.sql.
// CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
// CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Order status
  // CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
  status: text('status').notNull().default('pending'),
  statusHistory: jsonb('status_history').default([]),

  // Payment information
  paymentIntentId: text('payment_intent_id'),
  // CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
  paymentStatus: text('payment_status').default('pending'),
  paymentMethod: text('payment_method'),

  // Pricing
  subtotalCents: bigint('subtotal_cents', { mode: 'number' }).notNull().default(0),
  taxCents: bigint('tax_cents', { mode: 'number' }).notNull().default(0),
  shippingCents: bigint('shipping_cents', { mode: 'number' }).notNull().default(0),
  discountCents: bigint('discount_cents', { mode: 'number' }).notNull().default(0),
  totalAmountCents: bigint('total_amount_cents', { mode: 'number' }).notNull(),

  currency: text('currency').notNull().default('CHF'),

  // Shipping
  shippingAddress: jsonb('shipping_address'),
  shippingMethod: text('shipping_method'),
  trackingNumber: text('tracking_number'),
  estimatedDelivery: date('estimated_delivery'),

  // Seller information (for marketplace orders)
  sellerId: uuid('seller_id').references(() => users.id),

  // Notes
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_orders_user_id').on(table.userId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_payment_intent').on(table.paymentIntentId),
  index('idx_orders_created_at').on(table.createdAt),
  index('idx_orders_seller_id').on(table.sellerId),
])

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

// =============================================================================
// ORDER ITEMS
// =============================================================================
// Individual line items within an order.
// From 007_orders_system.sql.
// CHECK (quantity > 0)
// Note: inventory_item_id FK to inventory_items omitted — that table is in
// the inventory schema. Cross-schema FK is represented as a plain uuid column.

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),

  // Product information
  productTitle: text('product_title').notNull(),
  productSku: text('product_sku'),
  inventoryItemId: uuid('inventory_item_id'),

  // Quantity and pricing — CHECK (quantity > 0)
  quantity: integer('quantity').notNull(),
  unitPriceCents: bigint('unit_price_cents', { mode: 'number' }).notNull(),
  totalPriceCents: bigint('total_price_cents', { mode: 'number' }).notNull(),

  // Product metadata
  productMetadata: jsonb('product_metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_order_items_order_id').on(table.orderId),
  index('idx_order_items_inventory_item').on(table.inventoryItemId),
])

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

// =============================================================================
// ORDER STATUS HISTORY
// =============================================================================
// Tracks order status changes over time.
// From 007_orders_system.sql.

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_order_status_history_order_id').on(table.orderId),
  index('idx_order_status_history_created_at').on(table.createdAt),
])

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert

// =============================================================================
// PAYMENT TRANSACTIONS
// =============================================================================
// Detailed transaction records for all payment activity.
// From 008_payment_processing_system.sql.
// CHECK (type IN ('payment', 'refund', 'chargeback', 'payout', 'fee', 'transfer'))
// CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'disputed'))
// CHECK (amount_cents >= 0)

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => paymentProviders.id),

  // Transaction details
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }).unique(),
  // CHECK (type IN ('payment', 'refund', 'chargeback', 'payout', 'fee', 'transfer'))
  type: varchar('type', { length: 30 }).notNull(),
  // CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'disputed'))
  status: varchar('status', { length: 30 }).notNull().default('pending'),

  // Financial details — CHECK (amount_cents >= 0)
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CHF'),
  feeCents: bigint('fee_cents', { mode: 'number' }).default(0),
  netAmountCents: bigint('net_amount_cents', { mode: 'number' }).default(0),

  // Related entities
  orderId: uuid('order_id').references(() => orders.id),
  serviceAppointmentId: uuid('service_appointment_id'),
  workshopRegistrationId: uuid('workshop_registration_id'),

  // Payment method used
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),

  // Escrow information
  escrowReleaseDate: timestamp('escrow_release_date', { withTimezone: true, mode: 'string' }),
  escrowReleased: boolean('escrow_released').notNull().default(false),
  escrowReleaseReason: text('escrow_release_reason'),

  // Provider response data
  providerResponse: jsonb('provider_response').default({}),
  failureReason: text('failure_reason'),

  // Metadata and notes
  description: text('description'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata').default({}),

  // Timestamps
  processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_payment_transactions_user_id').on(table.userId),
  index('idx_payment_transactions_provider').on(table.providerId),
  index('idx_payment_transactions_status').on(table.status),
  index('idx_payment_transactions_type').on(table.type),
  index('idx_payment_transactions_created_at').on(table.createdAt),
  index('idx_payment_transactions_provider_tx_id').on(table.providerTransactionId),
  index('idx_payment_transactions_order_id').on(table.orderId),
  index('idx_payment_transactions_service_apt').on(table.serviceAppointmentId),
  index('idx_payment_transactions_workshop_reg').on(table.workshopRegistrationId),
])

export type PaymentTransaction = typeof paymentTransactions.$inferSelect
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert

// =============================================================================
// ESCROW ACCOUNTS
// =============================================================================
// Funds held in trust during service completion.
// From 008_payment_processing_system.sql.
// CHECK (status IN ('active', 'released', 'disputed', 'cancelled'))

export const escrowAccounts = pgTable('escrow_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => paymentTransactions.id, { onDelete: 'cascade' }),

  // Escrow details
  totalAmountCents: bigint('total_amount_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CHF'),
  heldAmountCents: bigint('held_amount_cents', { mode: 'number' }).notNull().default(0),
  releasedAmountCents: bigint('released_amount_cents', { mode: 'number' }).notNull().default(0),

  // Release conditions
  releaseConditions: jsonb('release_conditions').default({}),
  autoReleaseDays: integer('auto_release_days').default(7),
  releaseDeadline: timestamp('release_deadline', { withTimezone: true, mode: 'string' }),

  // Status — CHECK (status IN ('active', 'released', 'disputed', 'cancelled'))
  status: varchar('status', { length: 20 }).notNull().default('active'),

  // Related parties
  buyerId: uuid('buyer_id').notNull().references(() => users.id),
  sellerId: uuid('seller_id').references(() => users.id),

  // Release tracking
  releasedAt: timestamp('released_at', { withTimezone: true, mode: 'string' }),
  releasedBy: uuid('released_by').references(() => users.id),
  releaseNotes: text('release_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_escrow_accounts_transaction_id').on(table.transactionId),
  index('idx_escrow_accounts_buyer_id').on(table.buyerId),
  index('idx_escrow_accounts_seller_id').on(table.sellerId),
  index('idx_escrow_accounts_status').on(table.status),
  index('idx_escrow_accounts_release_deadline').on(table.releaseDeadline),
])

export type EscrowAccount = typeof escrowAccounts.$inferSelect
export type NewEscrowAccount = typeof escrowAccounts.$inferInsert

// =============================================================================
// ESCROW RELEASES
// =============================================================================
// Track partial or full escrow fund releases.
// From 008_payment_processing_system.sql.
// CHECK (release_type IN ('full', 'partial', 'refund', 'dispute'))

export const escrowReleases = pgTable('escrow_releases', {
  id: uuid('id').primaryKey().defaultRandom(),
  escrowAccountId: uuid('escrow_account_id').notNull().references(() => escrowAccounts.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => paymentTransactions.id),

  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  // CHECK (release_type IN ('full', 'partial', 'refund', 'dispute'))
  releaseType: varchar('release_type', { length: 20 }).notNull(),
  reason: text('reason'),

  releasedBy: uuid('released_by').notNull().references(() => users.id),
  releasedAt: timestamp('released_at', { withTimezone: true, mode: 'string' }).defaultNow(),

  metadata: jsonb('metadata').default({}),
}, (table) => [
  index('idx_escrow_releases_escrow_account_id').on(table.escrowAccountId),
  index('idx_escrow_releases_transaction_id').on(table.transactionId),
])

export type EscrowRelease = typeof escrowReleases.$inferSelect
export type NewEscrowRelease = typeof escrowReleases.$inferInsert

// =============================================================================
// INVOICES
// =============================================================================
// Invoice records for services, products, refunds, and credit notes.
// From 008_payment_processing_system.sql.
// CHECK (type IN ('service', 'product', 'refund', 'credit_note'))
// CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),

  // Invoice details
  // CHECK (type IN ('service', 'product', 'refund', 'credit_note'))
  type: varchar('type', { length: 20 }).notNull(),
  // CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
  status: varchar('status', { length: 20 }).notNull().default('draft'),

  // Related entities
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id),
  serviceAppointmentId: uuid('service_appointment_id'),
  workshopRegistrationId: uuid('workshop_registration_id'),

  // Financial details
  subtotalCents: bigint('subtotal_cents', { mode: 'number' }).notNull().default(0),
  taxCents: bigint('tax_cents', { mode: 'number' }).notNull().default(0),
  discountCents: bigint('discount_cents', { mode: 'number' }).notNull().default(0),
  totalCents: bigint('total_cents', { mode: 'number' }).notNull(),

  currency: varchar('currency', { length: 3 }).notNull().default('CHF'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).default('0.0770'),

  // Invoice data
  lineItems: jsonb('line_items').default([]),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),

  // Dates
  issueDate: date('issue_date').notNull().defaultNow(),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),

  // PDF and delivery
  pdfUrl: text('pdf_url'),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true, mode: 'string' }),
  emailedAt: timestamp('emailed_at', { withTimezone: true, mode: 'string' }),
  emailRecipient: varchar('email_recipient', { length: 255 }),

  // Notes
  notes: text('notes'),
  paymentTerms: text('payment_terms').default('Payment due within 30 days'),

  // Metadata (tax compliance info, etc.)
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_invoices_user_id').on(table.userId),
  index('idx_invoices_status').on(table.status),
  index('idx_invoices_type').on(table.type),
  index('idx_invoices_invoice_number').on(table.invoiceNumber),
  index('idx_invoices_due_date').on(table.dueDate),
  index('idx_invoices_order_id').on(table.orderId),
  index('idx_invoices_service_apt').on(table.serviceAppointmentId),
])

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert

// =============================================================================
// REFUNDS
// =============================================================================
// Refund requests and processing records.
// From 008_payment_processing_system.sql.
// CHECK (reason IN ('customer_request', 'service_cancelled', 'service_not_completed', 'duplicate_charge', 'fraud', 'other'))
// CHECK (status IN ('requested', 'approved', 'processing', 'completed', 'rejected', 'cancelled'))

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  refundNumber: varchar('refund_number', { length: 50 }).notNull().unique(),

  // Original transaction
  originalTransactionId: uuid('original_transaction_id').notNull().references(() => paymentTransactions.id),
  refundTransactionId: uuid('refund_transaction_id').references(() => paymentTransactions.id),

  // Refund details
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CHF'),
  // CHECK (reason IN ('customer_request', 'service_cancelled', 'service_not_completed', 'duplicate_charge', 'fraud', 'other'))
  reason: varchar('reason', { length: 50 }).notNull(),
  reasonDetails: text('reason_details'),

  // Status and processing
  // CHECK (status IN ('requested', 'approved', 'processing', 'completed', 'rejected', 'cancelled'))
  status: varchar('status', { length: 20 }).notNull().default('requested'),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  processedBy: uuid('processed_by').references(() => users.id),

  // Invoice
  invoiceId: uuid('invoice_id').references(() => invoices.id),

  // Timestamps
  requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
  processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),

  // Notes
  internalNotes: text('internal_notes'),
  customerNotes: text('customer_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_refunds_original_transaction').on(table.originalTransactionId),
  index('idx_refunds_refund_transaction').on(table.refundTransactionId),
  index('idx_refunds_status').on(table.status),
  index('idx_refunds_requested_by').on(table.requestedBy),
])

export type Refund = typeof refunds.$inferSelect
export type NewRefund = typeof refunds.$inferInsert

// =============================================================================
// PAYMENT DISPUTES
// =============================================================================
// Payment disputes and chargebacks.
// From 008_payment_processing_system.sql.
// CHECK (status IN ('opened', 'under_review', 'won', 'lost', 'cancelled'))
// CHECK (resolution IN ('won', 'lost', 'cancelled'))

export const paymentDisputes = pgTable('payment_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  disputeNumber: varchar('dispute_number', { length: 50 }).notNull().unique(),

  // Related transaction
  transactionId: uuid('transaction_id').notNull().references(() => paymentTransactions.id),
  providerDisputeId: varchar('provider_dispute_id', { length: 255 }),

  // Dispute details
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CHF'),
  reason: varchar('reason', { length: 50 }).notNull(),
  // CHECK (status IN ('opened', 'under_review', 'won', 'lost', 'cancelled'))
  status: varchar('status', { length: 20 }).notNull().default('opened'),

  // Evidence and response
  evidence: jsonb('evidence').default({}),
  response: text('response'),
  responseDeadline: timestamp('response_deadline', { withTimezone: true, mode: 'string' }),

  // Resolution — CHECK (resolution IN ('won', 'lost', 'cancelled'))
  resolution: varchar('resolution', { length: 20 }),
  resolutionAmountCents: bigint('resolution_amount_cents', { mode: 'number' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
  resolvedBy: uuid('resolved_by').references(() => users.id),

  // Related refund if applicable
  refundId: uuid('refund_id').references(() => refunds.id),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_payment_disputes_transaction_id').on(table.transactionId),
  index('idx_payment_disputes_status').on(table.status),
  index('idx_payment_disputes_provider_dispute_id').on(table.providerDisputeId),
])

export type PaymentDispute = typeof paymentDisputes.$inferSelect
export type NewPaymentDispute = typeof paymentDisputes.$inferInsert

// =============================================================================
// PAYMENT ANALYTICS
// =============================================================================
// Daily aggregated payment metrics for reporting.
// From 008_payment_processing_system.sql.
// UNIQUE (date, provider_id)

export const paymentAnalytics = pgTable('payment_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  providerId: uuid('provider_id').references(() => paymentProviders.id),

  // Daily totals
  totalTransactions: integer('total_transactions').default(0),
  totalVolumeCents: bigint('total_volume_cents', { mode: 'number' }).default(0),
  totalFeesCents: bigint('total_fees_cents', { mode: 'number' }).default(0),
  totalRefundsCents: bigint('total_refunds_cents', { mode: 'number' }).default(0),

  // Breakdowns
  currencyTotals: jsonb('currency_totals').default({}),
  statusBreakdown: jsonb('status_breakdown').default({}),
  typeBreakdown: jsonb('type_breakdown').default({}),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_payment_analytics_date').on(table.date),
  index('idx_payment_analytics_provider').on(table.providerId),
  uniqueIndex('payment_analytics_date_provider_unique').on(table.date, table.providerId),
])

export type PaymentAnalytic = typeof paymentAnalytics.$inferSelect
export type NewPaymentAnalytic = typeof paymentAnalytics.$inferInsert
