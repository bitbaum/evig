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
  PRODUCT_CATEGORIES: 'product_categories',
  PRODUCT_ATTRIBUTES: 'product_attributes',
  MARKETPLACE_LISTINGS: 'marketplace_listings',
  SUSTAINABILITY_SCORES: 'sustainability_scores',
  AI_PROCESSING_LOGS: 'ai_processing_logs',
  
  // Messaging
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications',
  MESSAGE_REACTIONS: 'message_reactions',
  USER_NOTIFICATION_PREFERENCES: 'user_notification_preferences',
  
  // Services & Appointments
  SERVICE_TYPES: 'service_types',
  SERVICE_APPOINTMENTS: 'service_appointments',
  
  // Workshops
  WORKSHOPS: 'workshops',
  WORKSHOP_INSTANCES: 'workshop_instances',
  WORKSHOP_REGISTRATIONS: 'workshop_registrations',
  WORKSHOP_PROPOSALS: 'workshop_proposals',
  WORKSHOP_MATERIALS: 'workshop_materials',

  // Locations
  LOCATIONS: 'locations',
  LOCATION_APPROVALS: 'location_approvals',
  LOCATION_BOOKINGS: 'location_bookings',
  
  // Applications & Profiles
  APPLICATIONS: 'applications',
  SELLER_APPLICATIONS: 'seller_applications',
  SELLER_PROFILES: 'seller_profiles',
  REPAIRER_APPLICATIONS: 'repairer_applications',
  REPAIRER_PROFILES: 'repairer_profiles',
  REPAIRER_SERVICES: 'repairer_services',
  REPAIRER_AVAILABILITY: 'repairer_availability',
  REPAIRER_REVIEWS: 'repairer_reviews',
  REPAIRER_CERTIFICATIONS: 'repairer_certifications',
  TECHNICIAN_PROFILES: 'technician_profiles',
  MEDUSA_CUSTOMER_LINKS: 'medusa_customer_links',

  // Other
  DONATIONS: 'donations',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscriptions',
  BLOG_POSTS: 'blog_posts',
  BLOG_SUBMISSIONS: 'blog_submissions',
  BLOG_CATEGORIES: 'blog_categories',
  STATIC_PAGES: 'static_pages',
  SERVICES: 'services',

  // User Roles & Permissions
  USER_ROLES: 'user_roles',
  ROLE_PERMISSIONS: 'role_permissions',
  PERMISSIONS: 'permissions',
  CUSTOMER_PREFERENCES: 'customer_preferences',
  CUSTOMER_SEGMENTS: 'customer_segments',
  USER_SEGMENTS: 'user_segments',

  // Payments & Transactions
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  PAYMENT_PROVIDERS: 'payment_providers',
  PAYMENT_DISPUTES: 'payment_disputes',
  PAYMENT_METHODS: 'payment_methods',
  PAYMENT_ANALYTICS: 'payment_analytics',
  ESCROW_ACCOUNTS: 'escrow_accounts',
  ESCROW_RELEASES: 'escrow_releases',
  REFUNDS: 'refunds',
  INVOICES: 'invoices',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  ORDER_STATUS_HISTORY: 'order_status_history',

  // Reviews
  REVIEWS: 'reviews',
  REVIEW_ATTACHMENTS: 'review_attachments',
  REVIEW_RESPONSES: 'review_responses',
  REVIEW_VOTES: 'review_votes',
  REVIEW_MODERATION_LOG: 'review_moderation_log',

  // Documents & Verification
  VERIFICATION_DOCUMENTS: 'verification_documents',
  DOCUMENT_TYPES: 'document_types',
  CERTIFICATION_TYPES: 'certification_types',

  // Auth & Security
  USER_LOCKOUTS: 'user_lockouts',
  AUTH_AUDIT_LOG: 'auth_audit_log',

  // IT-Hilfe Marketplace (formerly Peer Repair)
  IT_HILFE_REQUESTS: 'it_hilfe_requests',
  IT_HILFE_OFFERS: 'it_hilfe_offers',
  USER_SKILLS: 'user_skills',
  IT_HILFE_TECHNICIAN_PROFILES: 'helper_profiles',

  /** @deprecated Use IT_HILFE_REQUESTS instead. Remove after 2026-06-01. */
  PEER_REPAIR_REQUESTS: 'it_hilfe_requests',
  /** @deprecated Use IT_HILFE_OFFERS instead. Remove after 2026-06-01. */
  PEER_REPAIR_OFFERS: 'it_hilfe_offers',
  /** @deprecated Use IT_HILFE_TECHNICIAN_PROFILES instead. Remove after 2026-06-01. */
  HELPER_PROFILES: 'helper_profiles',

  // HIRN AI System
  HIRN_DOCUMENTS: 'hirn_documents',
  HIRN_CHUNKS: 'hirn_chunks',
  HIRN_CHAT_HISTORY: 'hirn_chat_history',
  HIRN_PROVIDER_SETTINGS: 'hirn_provider_settings',

  // Staff & Permissions
  STAFF_PERMISSION_REQUESTS: 'staff_permission_requests',
  TEAM_PROFILES: 'team_profiles',

  // Customer Profiles
  CUSTOMER_PROFILES: 'customer_profiles',
  PRODUCT_CUSTOMER_PROFILES: 'product_customer_profiles',

  // Task Management
  TASKS: 'tasks',
  TASK_COMPLETIONS: 'task_completions',
  TASK_ATTENTION_FLAGS: 'task_attention_flags',
  TASK_REQUESTS: 'task_requests',
  TASK_PROJECTS: 'task_projects',

  // Content Submissions
  USER_CONTENT_SUBMISSIONS: 'user_content_submissions',

  // Activity Stream
  ACTIVITY_UPDATES: 'activity_updates',
  HELP_REQUESTS: 'help_requests',

  // Meeting Protocols
  MEETING_PROTOCOLS: 'meeting_protocols',
  PROTOCOL_ACTION_LINKS: 'protocol_action_links',

  // Protocol-level decision voting (inline in action items)
  PROTOCOL_DECISION_VOTES: 'protocol_decision_votes',
  PROTOCOL_DECISION_OUTCOMES: 'protocol_decision_outcomes',

  // Team Decisions & Voting (standalone system)
  DECISIONS: 'decisions',
  DECISION_VOTES: 'decision_votes',
  DECISION_COMMENTS: 'decision_comments',

  // P2P Marketplace
  LISTINGS: 'listings',
  LISTING_IMAGES: 'listing_images',
  LISTING_FAVORITES: 'listing_favorites',
  MARKETPLACE_ORDERS: 'marketplace_orders',
} as const;

/**
 * Type for table name values
 */
export type TableName = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];

/**
 * Appointment role types for filtering
 */
export const APPOINTMENT_ROLES = {
  CUSTOMER: 'customer',
  REPAIRER: 'repairer',
} as const;

export type AppointmentRole = typeof APPOINTMENT_ROLES[keyof typeof APPOINTMENT_ROLES];

/**
 * Review target types
 */
export const REVIEW_TARGET_TYPES = {
  REPAIRER: 'repairer',
  SERVICE: 'service',
  WORKSHOP: 'workshop',
  IT_HILFE: 'it_hilfe',
  LISTING: 'listing',
  /** @deprecated Use IT_HILFE instead */
  PEER_REPAIR: 'it_hilfe',
} as const;

export type ReviewTargetType = typeof REVIEW_TARGET_TYPES[keyof typeof REVIEW_TARGET_TYPES];

/**
 * Conversation context types
 */
export const CONVERSATION_TYPES = {
  APPOINTMENT: 'appointment',
  GENERAL: 'general',
  IT_HILFE: 'it_hilfe',
  MARKETPLACE: 'marketplace',
  /** @deprecated Use IT_HILFE instead */
  PEER_REPAIR: 'it_hilfe',
} as const;

export type ConversationType = typeof CONVERSATION_TYPES[keyof typeof CONVERSATION_TYPES];

/**
 * Service categories for service_types table
 */
export const SERVICE_CATEGORIES = {
  REPAIR: 'repair',       // Computer repair, hardware upgrades, custom builds
  DATA: 'data',           // Data recovery, transfer, backup
  RECYCLING: 'recycling', // Hardware recycling, e-waste
  SOFTWARE: 'software',   // Linux, open source, installations
  WEB: 'web',             // Web design, development
  GENERAL: 'general',     // Consultation, general services
} as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[keyof typeof SERVICE_CATEGORIES];

/**
 * Featured service slugs (shown on /services page)
 * Order matches display_order in database
 */
export const FEATURED_SERVICE_SLUGS = [
  'computer-repair-upgrades',
  'data-recovery-transfer',
  'hardware-recycling',
  'linux-open-source',
  'web-design-development',
] as const;

export type FeaturedServiceSlug = typeof FEATURED_SERVICE_SLUGS[number];
