/**
 * Database configuration constants
 * 
 * Single Source of Truth for all database table names
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const TABLE_NAMES = {
  // User & Auth
  USERS: 'users',
  SESSIONS: 'sessions',
  ACCOUNTS: 'accounts',
  VERIFICATION_TOKENS: 'verification_tokens',
  USER_PROFILES: 'user_profiles',
  
  // Inventory & Products
  INVENTORY_ITEMS: 'inventory_items',
  AI_EXTRACTED_PRODUCTS: 'ai_extracted_products',
  PRODUCT_IMAGES: 'product_images',
  MARKETPLACE_LISTINGS: 'marketplace_listings',
  SUSTAINABILITY_SCORES: 'sustainability_scores',
  AI_PROCESSING_LOGS: 'ai_processing_logs',
  
  // Messaging
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications',
  
  // Services & Appointments
  SERVICE_TYPES: 'service_types',
  SERVICE_APPOINTMENTS: 'service_appointments',
  
  // Workshops
  WORKSHOPS: 'workshops',
  WORKSHOP_INSTANCES: 'workshop_instances',
  WORKSHOP_REGISTRATIONS: 'workshop_registrations',
  
  // Applications
  SELLER_APPLICATIONS: 'seller_applications',
  REPAIRER_APPLICATIONS: 'repairer_applications',
  REPAIRER_PROFILES: 'repairer_profiles',
  
  // Other
  DONATIONS: 'donations',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscriptions',
  BLOG_POSTS: 'blog_posts',
  BLOG_SUBMISSIONS: 'blog_submissions',
} as const;

/**
 * Type for table name values
 */
export type TableName = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];
