import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, varchar, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { inventoryItems } from './inventory'

// =============================================================================
// LISTINGS (P2P marketplace)
// =============================================================================
// Peer-to-peer marketplace listings. Any user can list items for sale.
// Final state includes columns from 031 + 043 (verified_at, verified_by,
// verification_notes, condition_checks).

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Product info
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceChf: decimal('price_chf', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  // Granular KATEGORIEN sub-code (e.g. 701 GPU, 704 CPU) for part-matching —
  // nullable; carried from ai_extracted_products.subcategory on publish (mig 118).
  subcategory: text('subcategory'),
  // CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor', 'defect'))
  condition: text('condition').notNull(),
  brand: text('brand'),
  model: text('model'),

  // Delivery
  // CHECK (delivery_options IN ('pickup', 'shipping', 'both'))
  deliveryOptions: text('delivery_options').notNull().default('pickup'),
  shippingCostChf: decimal('shipping_cost_chf', { precision: 10, scale: 2 }),
  pickupLocation: text('pickup_location'),

  // Payment
  // CHECK (payment_mode IN ('secure', 'direct', 'both'))
  paymentMode: text('payment_mode').notNull().default('direct'),

  // Status
  // CHECK (status IN ('active', 'sold', 'reserved', 'draft', 'removed'))
  status: text('status').notNull().default('active'),

  // RevampIT inventory link — LIVE (unified storefront). RevampIT shop stock is
  // published into this `listings` table via lib/marketplace/publishRevampitListing
  // (sets is_revampit=true + inventory_item_id). is_revampit is the single source
  // of truth — never re-derive it from the seller's email. (The legacy
  // marketplace_listings table + /api/shop/inventory were removed, migration 103.)
  isRevampit: boolean('is_revampit').notNull().default(false),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'set null' }),

  // Denormalized counters
  viewCount: integer('view_count').notNull().default(0),
  favoriteCount: integer('favorite_count').notNull().default(0),

  // Added by 043: verification columns for RevampIT-tested items
  verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'string' }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationNotes: text('verification_notes'),

  // Added by 043: category-specific condition criteria
  conditionChecks: jsonb('condition_checks'),

  // Added by 045: internal admin notes
  adminNotes: text('admin_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  // 031: partial composite index for active listings browse
  index('idx_listings_active_browse').on(table.category, table.condition, table.createdAt),
  // 031: seller's own listings
  index('idx_listings_seller').on(table.sellerId, table.status),
  // 041: status filter for active listings
  index('idx_listings_status_created').on(table.status, table.createdAt),
  // 055: verified listings filter + price range queries
  index('idx_listings_verified_at').on(table.verifiedAt),
  index('idx_listings_price_chf').on(table.priceChf),
])

export type Listing = typeof listings.$inferSelect
export type NewListing = typeof listings.$inferInsert

// =============================================================================
// LISTING IMAGES
// =============================================================================
// Images attached to P2P listings. One primary image per listing (enforced by
// unique partial index).

export const listingImages = pgTable('listing_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  // 031 + 041: general lookup by listing
  index('idx_listing_images_listing').on(table.listingId, table.position),
])

export type ListingImage = typeof listingImages.$inferSelect
export type NewListingImage = typeof listingImages.$inferInsert

// =============================================================================
// LISTING SPECS
// =============================================================================
// Structured technical specifications per listing (added by 043).

export const listingSpecs = pgTable('listing_specs', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  specKey: text('spec_key').notNull(),
  specValue: text('spec_value').notNull(),
  specUnit: text('spec_unit'),
  normalizedValue: numeric('normalized_value'),
}, (table) => [
  uniqueIndex('listing_specs_listing_id_spec_key_unique').on(table.listingId, table.specKey),
  index('idx_listing_specs_listing').on(table.listingId),
  index('idx_listing_specs_filter').on(table.specKey, table.normalizedValue),
])

export type ListingSpec = typeof listingSpecs.$inferSelect
export type NewListingSpec = typeof listingSpecs.$inferInsert

// =============================================================================
// LISTING FAVORITES
// =============================================================================
// User favorites/bookmarks for listings. Unique per user+listing pair.

export const listingFavorites = pgTable('listing_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('listing_favorites_user_id_listing_id_unique').on(table.userId, table.listingId),
  index('idx_listing_favorites_user').on(table.userId),
  index('idx_listing_favorites_listing').on(table.listingId),
  // 041: composite for user+listing lookups
  index('idx_listing_favorites_user_listing').on(table.userId, table.listingId),
])

export type ListingFavorite = typeof listingFavorites.$inferSelect
export type NewListingFavorite = typeof listingFavorites.$inferInsert

// =============================================================================
// LISTING REPORTS
// =============================================================================
// Moderation reports for marketplace listings (added by 044).

export const listingReports = pgTable('listing_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 50 }).notNull(),
  details: text('details'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  resolutionAction: varchar('resolution_action', { length: 50 }),
  resolutionNotes: text('resolution_notes'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
}, (table) => [
  uniqueIndex('listing_reports_listing_id_reporter_id_unique').on(table.listingId, table.reporterId),
  index('idx_listing_reports_listing').on(table.listingId),
  index('idx_listing_reports_status').on(table.status),
])

export type ListingReport = typeof listingReports.$inferSelect
export type NewListingReport = typeof listingReports.$inferInsert

// =============================================================================
// LISTING QUESTIONS (public Q&A — Ricardo-style)
// =============================================================================

export const listingQuestions = pgTable('listing_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  askerId: uuid('asker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at', { withTimezone: true, mode: 'string' }),
  answeredBy: uuid('answered_by').references(() => users.id, { onDelete: 'set null' }),
  // CHECK (status IN ('open', 'answered', 'hidden'))
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_listing_questions_listing').on(table.listingId, table.createdAt),
  index('idx_listing_questions_asker').on(table.askerId),
  index('idx_listing_questions_status').on(table.listingId, table.status),
])

export type ListingQuestion = typeof listingQuestions.$inferSelect
export type NewListingQuestion = typeof listingQuestions.$inferInsert

// =============================================================================
// MARKETPLACE ORDERS (secure payment mode only)
// =============================================================================
// Orders for P2P transactions using secure payment (escrow).
// CONSTRAINT chk_payout_math: seller_payout_chf = amount_chf - commission_chf

export const marketplaceOrders = pgTable('marketplace_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Single-item P2P orders set this directly; multi-item RevampIT cart orders
  // leave it null and list their items in marketplace_order_items (089).
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }),

  // Financial
  amountChf: decimal('amount_chf', { precision: 10, scale: 2 }).notNull(),
  commissionChf: decimal('commission_chf', { precision: 10, scale: 2 }).notNull(),
  sellerPayoutChf: decimal('seller_payout_chf', { precision: 10, scale: 2 }).notNull(),

  // Payment
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  payrexxGatewayId: text('payrexx_gateway_id'),
  payrexxTransactionId: text('payrexx_transaction_id'),
  paymentProvider: text('payment_provider'),

  // Status
  // CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'))
  status: text('status').notNull().default('pending'),

  // Delivery
  // CHECK (delivery_method IN ('pickup', 'shipping'))
  deliveryMethod: text('delivery_method').notNull(),
  trackingNumber: text('tracking_number'),
  shippingAddress: jsonb('shipping_address'),

  // Added by 058: lifecycle timestamps for buyer confirmation and review flow
  deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_marketplace_orders_buyer').on(table.buyerId, table.status),
  index('idx_marketplace_orders_seller').on(table.sellerId, table.status),
  index('idx_marketplace_orders_listing').on(table.listingId),
])

export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect
export type NewMarketplaceOrder = typeof marketplaceOrders.$inferInsert

// =============================================================================
// MARKETPLACE ORDER ITEMS (089)
// =============================================================================
// Line items for a multi-item RevampIT cart order. Distinct from the legacy
// Medusa `order_items` (which references the separate `orders` table).
export const marketplaceOrderItems = pgTable('marketplace_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => marketplaceOrders.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  unitPriceChf: decimal('unit_price_chf', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
}, (table) => [
  index('idx_marketplace_order_items_order').on(table.orderId),
  index('idx_marketplace_order_items_listing').on(table.listingId),
])

export type MarketplaceOrderItem = typeof marketplaceOrderItems.$inferSelect
export type NewMarketplaceOrderItem = typeof marketplaceOrderItems.$inferInsert

// =============================================================================
// SELLER PROFILES
// =============================================================================
// Seller profiles for the marketplace. Created from approved seller applications
// (006) or auto-created on first P2P listing (031).
// Final state includes columns from 006 + 031 (display_name, bio, avatar_url,
// canton, total_listings, total_sold). Columns made nullable by 031.

export const sellerProfiles = pgTable('seller_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Business information (nullable after 031 P2P migration)
  businessName: text('business_name'),
  // CHECK (business_type IN ('individual', 'business'))
  businessType: text('business_type'),
  taxId: text('tax_id'),

  // Contact: only city is written (storefront location). phone/address/postal_code
  // were never written by any code path — dropped in migration 104.
  city: text('city'),

  // Seller settings
  productTypes: text('product_types').array().default([]),
  isVerified: boolean('is_verified').default(false),
  verificationDate: timestamp('verification_date', { withTimezone: true, mode: 'string' }),

  // Performance metrics
  totalSales: integer('total_sales').default(0),
  totalRevenueCents: integer('total_revenue_cents').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.0'),
  totalReviews: integer('total_reviews').default(0),

  // Seller preferences
  autoPublish: boolean('auto_publish').default(true),
  notificationPreferences: jsonb('notification_preferences').default({ email: true, sms: false }),

  // Added by 031: P2P-specific fields
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  canton: text('canton'),
  totalListings: integer('total_listings').default(0),
  totalSold: integer('total_sold').default(0),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_seller_profiles_user').on(table.userId),
  index('idx_seller_profiles_verified').on(table.isVerified),
  index('idx_seller_profiles_rating').on(table.averageRating),
])

export type SellerProfile = typeof sellerProfiles.$inferSelect
export type NewSellerProfile = typeof sellerProfiles.$inferInsert

// =============================================================================
// SELLER APPLICATIONS — DEPRECATED, UNUSED
// =============================================================================
// Legacy application workflow from migration 006. Superseded by auto-creation
// of seller profiles on first P2P listing (migration 031).
// Zero references in application code. Retained as schema history only.
// Do not add new code that writes to or reads from this table.

export const sellerApplications = pgTable('seller_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Business information
  businessName: text('business_name'),
  // CHECK (business_type IN ('individual', 'business'))
  businessType: text('business_type').notNull(),
  taxId: text('tax_id'),

  // Contact information
  address: text('address').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  phone: text('phone').notNull(),

  // Application details
  experience: text('experience'),
  productTypes: text('product_types').array().notNull().default([]),
  motivation: text('motivation'),

  // Legal
  termsAccepted: boolean('terms_accepted').notNull().default(false),

  // Status
  // CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
  status: text('status').notNull().default('pending'),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),

  // Rejection/suspension details
  rejectionReason: text('rejection_reason'),
  suspensionReason: text('suspension_reason'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_seller_applications_user_id').on(table.userId),
  index('idx_seller_applications_status').on(table.status),
  index('idx_seller_applications_submitted_at').on(table.submittedAt),
])

export type SellerApplication = typeof sellerApplications.$inferSelect
export type NewSellerApplication = typeof sellerApplications.$inferInsert
