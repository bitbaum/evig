import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// AI EXTRACTED PRODUCTS
// =============================================================================
// Core table for AI-powered product data extraction from images.
// Final state includes columns from 004 + 012 (short_description, item_uuid)
// + 046 (source_type).

export const aiExtractedProducts = pgTable('ai_extracted_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalImageUrl: text('original_image_url'),
  extractedAt: timestamp('extracted_at', { withTimezone: true, mode: 'string' }).defaultNow(),

  // Basic product information
  productName: text('product_name'),
  // CHECK (product_name_confidence >= 0 AND product_name_confidence <= 1)
  productNameConfidence: decimal('product_name_confidence', { precision: 3, scale: 2 }),
  brand: text('brand'),
  // CHECK (brand_confidence >= 0 AND brand_confidence <= 1)
  brandConfidence: decimal('brand_confidence', { precision: 3, scale: 2 }),
  model: text('model'),
  // CHECK (model_confidence >= 0 AND model_confidence <= 1)
  modelConfidence: decimal('model_confidence', { precision: 3, scale: 2 }),

  // Categorization
  category: text('category'),
  // CHECK (category_confidence >= 0 AND category_confidence <= 1)
  categoryConfidence: decimal('category_confidence', { precision: 3, scale: 2 }),
  subcategory: text('subcategory'),
  // CHECK (subcategory_confidence >= 0 AND subcategory_confidence <= 1)
  subcategoryConfidence: decimal('subcategory_confidence', { precision: 3, scale: 2 }),

  // Pricing and condition
  estimatedPriceChf: decimal('estimated_price_chf', { precision: 10, scale: 2 }),
  // CHECK (price_confidence >= 0 AND price_confidence <= 1)
  priceConfidence: decimal('price_confidence', { precision: 3, scale: 2 }),
  // CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor', 'damaged'))
  condition: text('condition'),
  // CHECK (condition_confidence >= 0 AND condition_confidence <= 1)
  conditionConfidence: decimal('condition_confidence', { precision: 3, scale: 2 }),

  // Technical specifications
  specifications: jsonb('specifications').default({}),
  // CHECK (specs_confidence >= 0 AND specs_confidence <= 1)
  specsConfidence: decimal('specs_confidence', { precision: 3, scale: 2 }),

  // Additional metadata
  color: text('color'),
  // CHECK (color_confidence >= 0 AND color_confidence <= 1)
  colorConfidence: decimal('color_confidence', { precision: 3, scale: 2 }),
  material: text('material'),
  // CHECK (material_confidence >= 0 AND material_confidence <= 1)
  materialConfidence: decimal('material_confidence', { precision: 3, scale: 2 }),
  dimensions: jsonb('dimensions').default({}),
  weightGrams: integer('weight_grams'),
  // CHECK (weight_confidence >= 0 AND weight_confidence <= 1)
  weightConfidence: decimal('weight_confidence', { precision: 3, scale: 2 }),

  // AI processing metadata
  aiProvider: text('ai_provider').default('openai'),
  aiModel: text('ai_model').default('gpt-4-vision-preview'),
  processingTimeMs: integer('processing_time_ms'),
  // CHECK (total_confidence >= 0 AND total_confidence <= 1)
  totalConfidence: decimal('total_confidence', { precision: 3, scale: 2 }),

  // Raw AI response for debugging/analysis
  rawAiResponse: jsonb('raw_ai_response').default({}),

  // User and processing status
  createdBy: uuid('created_by').references(() => users.id),
  // CHECK (status IN ('pending_review', 'approved', 'rejected', 'processed'))
  status: text('status').default('pending_review'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  reviewNotes: text('review_notes'),

  // Integration fields
  kivitendoArticleNumber: text('kivitendo_article_number'),
  // medusa_product_id (TS removed 2026-05-26): abandoned Medusa
  // integration, no consumers anywhere in src/. Column stays in DB
  // until a future migration drops it. See payments.ts + below in
  // inventoryItems for the parallel removals.
  marketplaceListingId: text('marketplace_listing_id'),

  // Added by 012: short description
  shortDescription: text('short_description'),
  // Added by 012: human-readable item UUID (format: I-YYMMDD-NNNN)
  itemUuid: text('item_uuid').unique(),

  // Added by 046: source tracking
  // Values: 'erfassung', 'intake', 'bulk_import'
  sourceType: varchar('source_type', { length: 20 }).default('erfassung'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_ai_products_status').on(table.status),
  index('idx_ai_products_brand').on(table.brand),
  index('idx_ai_products_category').on(table.category),
  index('idx_ai_products_created_by').on(table.createdBy),
  index('idx_ai_products_kivitendo').on(table.kivitendoArticleNumber),
])

export type AiExtractedProduct = typeof aiExtractedProducts.$inferSelect
export type NewAiExtractedProduct = typeof aiExtractedProducts.$inferInsert

// =============================================================================
// INVENTORY ITEMS
// =============================================================================
// Links AI extraction to physical inventory. Tracks location, quantity, pricing.
// Final state includes columns from 004 + 012 (box_id) + 046 (intake_tier,
// intake_checklist, checklist_complete, source_donation_id) + 047 (intake_events).
// Migration 037 added medusa_variant_id; the Drizzle declaration was removed in
// 15e443fb when the abandoned Medusa integration was cleaned up at the TS layer
// (DB column itself stays until a future drop-column migration).

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  aiProductId: uuid('ai_product_id').references(() => aiExtractedProducts.id),

  // Legacy system integration
  kivitendoArticleNumber: text('kivitendo_article_number').unique(),
  legacyCsvData: jsonb('legacy_csv_data').default({}),

  // Kivvi ERP integration — canonical ERP record reference
  // Set after successful push to Kivvi API on erfassung
  kivviInventoryItemId: uuid('kivvi_inventory_item_id').unique(),
  // 'pending' = not yet pushed | 'synced' = Kivvi has it | 'error' = last push failed
  kivviSyncStatus: text('kivvi_sync_status').default('pending'),
  kivviSyncedAt: timestamp('kivvi_synced_at', { withTimezone: true, mode: 'string' }),

  // Physical inventory tracking
  location: text('location'),
  quantityAvailable: integer('quantity_available').default(0),
  quantityReserved: integer('quantity_reserved').default(0),
  quantitySold: integer('quantity_sold').default(0),

  // Status tracking
  // CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'missing'))
  status: text('status').default('available'),
  // CHECK (condition_override IN ('new', 'like_new', 'good', 'fair', 'poor', 'damaged'))
  conditionOverride: text('condition_override'),
  conditionNotes: text('condition_notes'),

  // Pricing
  acquisitionCostChf: decimal('acquisition_cost_chf', { precision: 10, scale: 2 }),
  sellingPriceChf: decimal('selling_price_chf', { precision: 10, scale: 2 }),
  minSellingPriceChf: decimal('min_selling_price_chf', { precision: 10, scale: 2 }),

  // Marketplace integration
  // medusa_product_id + medusa_variant_id (TS removed 2026-05-26):
  // abandoned Medusa integration, no consumers in src/. Columns stay
  // in DB until a future migration drops them along with the
  // marketplace_listing_id reference above and the payments.ts ones.
  // CHECK (marketplace_status IN ('draft', 'published', 'sold', 'archived'))
  marketplaceStatus: text('marketplace_status').default('draft'),

  // User assignments
  assignedTo: uuid('assigned_to').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'string' }),
  assignmentNotes: text('assignment_notes'),

  // Added by 012: box ID for physical storage
  boxId: text('box_id'),

  // Added by 046: unified intake workflow
  // Values: 'refurbish', 'parts', 'recycle'. NULL = legacy item
  intakeTier: varchar('intake_tier', { length: 20 }),
  // JSONB checklist state: { itemId: { completed, completedBy, completedAt, notes } }
  intakeChecklist: jsonb('intake_checklist').default({}),
  // Derived flag: true when all required checklist items are completed. Gates marketplace publishing.
  checklistComplete: boolean('checklist_complete').default(false),
  // Link to donation record if this item came from a device donation
  sourceDonationId: uuid('source_donation_id'),

  // Added by 047: chronological audit trail of intake processing events
  // Each event: { type, description, userId, userEmail, timestamp, metadata? }
  intakeEvents: jsonb('intake_events').default([]),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_inventory_status').on(table.status),
  index('idx_inventory_location').on(table.location),
  index('idx_inventory_kivitendo').on(table.kivitendoArticleNumber),
  index('idx_inventory_assigned_to').on(table.assignedTo),
  // 046 indexes
  index('idx_inventory_intake_tier').on(table.intakeTier),
  index('idx_inventory_donation').on(table.sourceDonationId),
  index('idx_inventory_checklist_complete').on(table.checklistComplete),
])

export type InventoryItem = typeof inventoryItems.$inferSelect
export type NewInventoryItem = typeof inventoryItems.$inferInsert

// =============================================================================
// PRODUCT IMAGES
// =============================================================================
// Enhanced product images with AI analysis metadata.

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => aiExtractedProducts.id, { onDelete: 'cascade' }),

  // File information
  filename: text('filename').notNull(),
  originalFilename: text('original_filename'),
  filePath: text('file_path').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: text('mime_type'),

  // AI analysis
  aiDescription: text('ai_description'),
  aiTags: text('ai_tags').array(),
  isPrimary: boolean('is_primary').default(false),

  // Image metadata
  width: integer('width'),
  height: integer('height'),
  dominantColors: text('dominant_colors').array(),
  imageQuality: decimal('image_quality', { precision: 3, scale: 2 }),

  // Processing status
  // CHECK (upload_status IN ('uploading', 'processing', 'ready', 'failed'))
  uploadStatus: text('upload_status').default('processing'),
  processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),

  // User and permissions
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  isPublic: boolean('is_public').default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type ProductImage = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert

// =============================================================================
// SUSTAINABILITY SCORES
// =============================================================================
// AI-assessed sustainability scoring for extracted products.

export const sustainabilityScores = pgTable('sustainability_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => aiExtractedProducts.id, { onDelete: 'cascade' }),

  // Overall sustainability score (0-100)
  // CHECK (overall_score >= 0 AND overall_score <= 100)
  overallScore: integer('overall_score'),

  // Component scores (0-100 each)
  // CHECK (environmental_score >= 0 AND environmental_score <= 100)
  environmentalScore: integer('environmental_score'),
  // CHECK (social_score >= 0 AND social_score <= 100)
  socialScore: integer('social_score'),
  // CHECK (economic_score >= 0 AND economic_score <= 100)
  economicScore: integer('economic_score'),

  // Detailed factors
  factors: jsonb('factors').default({}),

  // AI analysis
  aiAnalysis: jsonb('ai_analysis').default({}),
  aiProvider: text('ai_provider').default('openai'),
  aiModel: text('ai_model'),

  // Recommendations
  recommendations: text('recommendations').array(),
  improvementSuggestions: text('improvement_suggestions').array(),

  // Metadata
  assessedAt: timestamp('assessed_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  // Values: 'ai', 'expert', 'user'
  assessedBy: text('assessed_by').default('ai'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type SustainabilityScore = typeof sustainabilityScores.$inferSelect
export type NewSustainabilityScore = typeof sustainabilityScores.$inferInsert

// =============================================================================
// AI PROCESSING LOGS
// =============================================================================
// Logs for debugging AI extraction and scoring operations.

export const aiProcessingLogs = pgTable('ai_processing_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => aiExtractedProducts.id),

  // Request details
  // Values: 'image_analysis', 'text_extraction', 'sustainability_scoring'
  requestType: text('request_type').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputData: jsonb('input_data').default({}),

  // Response details
  responseData: jsonb('response_data').default({}),
  processingTimeMs: integer('processing_time_ms'),
  tokensUsed: integer('tokens_used'),
  costCents: decimal('cost_cents', { precision: 8, scale: 4 }),

  // Quality metrics
  // CHECK (confidence_score >= 0 AND confidence_score <= 1)
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  // CHECK (accuracy_rating >= 0 AND accuracy_rating <= 1)
  accuracyRating: decimal('accuracy_rating', { precision: 3, scale: 2 }),
  errorMessage: text('error_message'),

  // Metadata
  userId: uuid('user_id').references(() => users.id),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type AiProcessingLog = typeof aiProcessingLogs.$inferSelect
export type NewAiProcessingLog = typeof aiProcessingLogs.$inferInsert

// =============================================================================
// MARKETPLACE LISTINGS (RevampIT internal shop — not P2P)
// =============================================================================
// Tracks RevampIT's own inventory items as shop listings (platform = 'internal').
//
// Written by:
//   - src/lib/erfassung/create-product.ts  (on publish action during erfassung)
//   - src/lib/admin/inventory-actions.ts   (publishProduct / unpublishProduct)
//   - src/app/api/admin/intake/[id]/publish/route.ts  (intake publish)
//
// Served by: /api/shop/inventory/ routes (NOT /api/listings/)
//
// IMPORTANT: Do NOT confuse with the P2P `listings` table in marketplace.ts.
// The `listings` table is for community peer-to-peer sales.
// This table is exclusively for RevampIT's own refurbished stock.

export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'cascade' }),

  // Listing details
  title: text('title').notNull(),
  description: text('description'),
  priceChf: decimal('price_chf', { precision: 10, scale: 2 }).notNull(),

  // Platform integration. In practice only MARKETPLACE_LISTING_PLATFORM.INTERNAL
  // ('internal') is written — see create-product.ts:273, inventory-actions.ts:78,
  // intake/[id]/publish/route.ts:97. The 'medusa' and 'external_api' values
  // mentioned in earlier comments were aspirational for integrations that never
  // shipped (Medusa was abandoned — see TS-removal note at line 113).
  platform: text('platform').notNull(),
  platformListingId: text('platform_listing_id'),
  platformUrl: text('platform_url'),

  // Status and visibility
  // CHECK (status IN ('draft', 'published', 'sold', 'paused', 'expired'))
  status: text('status').default('draft'),
  isFeatured: boolean('is_featured').default(false),
  viewsCount: integer('views_count').default(0),
  favoritesCount: integer('favorites_count').default(0),

  // Sales tracking
  soldAt: timestamp('sold_at', { withTimezone: true, mode: 'string' }),
  soldPriceChf: decimal('sold_price_chf', { precision: 10, scale: 2 }),
  buyerInfo: jsonb('buyer_info').default({}),

  // Metadata
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
  createdBy: uuid('created_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_listings_status').on(table.status),
  index('idx_listings_platform').on(table.platform),
  index('idx_listings_created_by').on(table.createdBy),
])

export type MarketplaceListing = typeof marketplaceListings.$inferSelect
export type NewMarketplaceListing = typeof marketplaceListings.$inferInsert

// =============================================================================
// PRODUCT CATEGORIES
// =============================================================================
// Hierarchical product categorization with AI detection keywords.

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  level: integer('level').default(1),

  // Display and SEO
  icon: text('icon'),
  color: varchar('color', { length: 7 }),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),

  // Metadata
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  aiDetectionKeywords: text('ai_detection_keywords').array(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_categories_parent').on(table.parentId),
  index('idx_categories_level').on(table.level),
  index('idx_categories_active').on(table.isActive),
])

export type ProductCategory = typeof productCategories.$inferSelect
export type NewProductCategory = typeof productCategories.$inferInsert

// =============================================================================
// PRODUCT ATTRIBUTES
// =============================================================================
// Structured attributes per category for AI extraction and filtering.

export const productAttributes = pgTable('product_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => productCategories.id),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 150 }),
  // CHECK (data_type IN ('text', 'number', 'boolean', 'select', 'multiselect', 'date'))
  dataType: varchar('data_type', { length: 20 }).default('text'),
  unit: varchar('unit', { length: 20 }),
  isRequired: boolean('is_required').default(false),
  isFilterable: boolean('is_filterable').default(false),
  options: text('options').array().default([]),

  // AI extraction
  aiExtractionPrompt: text('ai_extraction_prompt'),
  aiConfidenceThreshold: decimal('ai_confidence_threshold', { precision: 3, scale: 2 }).default('0.7'),

  // Display
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('product_attributes_category_id_name_unique').on(table.categoryId, table.name),
])

export type ProductAttribute = typeof productAttributes.$inferSelect
export type NewProductAttribute = typeof productAttributes.$inferInsert

// =============================================================================
// CUSTOMER PROFILES
// =============================================================================
// Lookup table defining customer archetypes (e.g. "Oma", "Gamer", "Büro").

export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  nameDe: varchar('name_de', { length: 100 }).notNull(),
  description: text('description'),
  descriptionDe: text('description_de'),

  // Profile characteristics
  icon: text('icon'),
  color: varchar('color', { length: 7 }),

  // Hardware requirements (1-5 scale)
  // CHECK (hw_requirement_min >= 1 AND hw_requirement_min <= 5)
  hwRequirementMin: integer('hw_requirement_min').default(1),
  // CHECK (hw_requirement_max >= 1 AND hw_requirement_max <= 5)
  hwRequirementMax: integer('hw_requirement_max').default(3),

  // Use case tags
  useCases: text('use_cases').array().default([]),
  recommendedOs: text('recommended_os').array().default([]),

  // Sorting and display
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_customer_profiles_active').on(table.isActive),
])

export type CustomerProfile = typeof customerProfiles.$inferSelect
export type NewCustomerProfile = typeof customerProfiles.$inferInsert

// =============================================================================
// PRODUCT CUSTOMER PROFILES (many-to-many link)
// =============================================================================
// Links products to customer profiles with suitability scores.

export const productCustomerProfiles = pgTable('product_customer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull(),
  profileId: uuid('profile_id').notNull().references(() => customerProfiles.id, { onDelete: 'cascade' }),

  // Suitability score (0-100)
  // CHECK (suitability_score >= 0 AND suitability_score <= 100)
  suitabilityScore: integer('suitability_score').default(80),

  // How it was assigned
  // CHECK (assigned_by IN ('manual', 'ai', 'rule'))
  assignedBy: text('assigned_by').default('manual'),
  assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('product_customer_profiles_product_profile_unique').on(table.productId, table.profileId),
  index('idx_product_profiles_product').on(table.productId),
  index('idx_product_profiles_profile').on(table.profileId),
])

export type ProductCustomerProfile = typeof productCustomerProfiles.$inferSelect
export type NewProductCustomerProfile = typeof productCustomerProfiles.$inferInsert
