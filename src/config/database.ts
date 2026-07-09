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
  WORKSHOP_PROPOSALS: 'workshop_proposals',
  WORKSHOP_MATERIALS: 'workshop_materials',

  // Locations
  LOCATIONS: 'locations',
  LOCATION_APPROVALS: 'location_approvals',
  LOCATION_BOOKINGS: 'location_bookings',
  
  // Applications & Profiles
  SELLER_APPLICATIONS: 'seller_applications',
  SELLER_PROFILES: 'seller_profiles',
  REPAIRER_PROFILES: 'technician_profiles',
  REPAIRER_SERVICES: 'technician_services',
  REPAIRER_AVAILABILITY: 'technician_availability',
  REPAIRER_REVIEWS: 'technician_reviews',

  // Membership
  MEMBERSHIP_APPLICATIONS: 'membership_applications',

  // Other
  DONATIONS: 'donations',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscriptions',
  BLOG_POSTS: 'blog_posts',
  BLOG_SUBMISSIONS: 'blog_submissions',
  BLOG_CATEGORIES: 'blog_categories',
  STATIC_PAGES: 'static_pages',

  // Applications
  APPLICATIONS: 'applications',

  // Legacy Role & Permission tables (raw SQL, no Drizzle schema)
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
  ESCROW_ACCOUNTS: 'escrow_accounts',
  ESCROW_RELEASES: 'escrow_releases',
  REFUNDS: 'refunds',
  INVOICES: 'invoices',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',

  // Reviews
  REVIEWS: 'reviews',
  REVIEW_ATTACHMENTS: 'review_attachments',
  REVIEW_RESPONSES: 'review_responses',
  REVIEW_VOTES: 'review_votes',
  REVIEW_MODERATION_LOG: 'review_moderation_log',

  // Auth & Security
  USER_LOCKOUTS: 'user_lockouts',
  AUTH_AUDIT_LOG: 'auth_audit_log',

  // IT-Hilfe Marketplace (formerly Peer Repair)
  IT_HILFE_REQUESTS: 'it_hilfe_requests',
  IT_HILFE_OFFERS: 'it_hilfe_offers',
  USER_SKILLS: 'user_skills',
  IT_HILFE_TECHNICIAN_PROFILES: 'technician_profiles',

  // HIRN AI System
  HIRN_DOCUMENTS: 'hirn_documents',
  HIRN_CHUNKS: 'hirn_chunks',
  HIRN_CHAT_HISTORY: 'hirn_chat_history',
  HIRN_PROVIDER_SETTINGS: 'hirn_provider_settings',

  // Staff & Permissions
  STAFF_PERMISSION_REQUESTS: 'staff_permission_requests',
  TEAM_PROFILES: 'team_profiles',
  JOB_POSTINGS: 'job_postings',
  JOB_APPLICATIONS: 'job_applications',
  JOB_APPLICATION_EVENTS: 'job_application_events',
  TIME_OFF_REQUESTS: 'time_off_requests',

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

  // Team Decisions & Voting (standalone system)
  DECISIONS: 'decisions',
  DECISION_VOTES: 'decision_votes',
  DECISION_COMMENTS: 'decision_comments',

  // P2P Marketplace
  LISTINGS: 'listings',
  LISTING_IMAGES: 'listing_images',
  LISTING_SPECS: 'listing_specs',
  LISTING_FAVORITES: 'listing_favorites',
  LISTING_REPORTS: 'listing_reports',
  LISTING_QUESTIONS: 'listing_questions',
  MARKETPLACE_ORDERS: 'marketplace_orders',
  MARKETPLACE_ORDER_ITEMS: 'marketplace_order_items',

  // Organizational Numbers (shared SSOT)
  ORG_NUMBERS: 'org_numbers',

  // Messaging (extended)
  MESSAGE_REACTIONS: 'message_reactions',
  USER_NOTIFICATION_PREFERENCES: 'user_notification_preferences',

  // Order History
  ORDER_STATUS_HISTORY: 'order_status_history',

  // Payment (extended)
  PAYMENT_ANALYTICS: 'payment_analytics',
  PAYMENT_METHODS: 'payment_methods',

  // Subscription Pools
  SUBSCRIPTION_POOLS: 'subscription_pools',
  POOL_MEMBERSHIPS: 'pool_memberships',
  POOL_CONTRIBUTIONS: 'pool_contributions',
  POOL_VOTES: 'pool_votes',

  // Product Taxonomy
  PRODUCT_ATTRIBUTES: 'product_attributes',
  PRODUCT_CATEGORIES: 'product_categories',

  // Public Projects (resource matching)
  PROJECTS: 'projects',
  PROJECT_NEEDS: 'project_needs',
  PROJECT_CONTRIBUTIONS: 'project_contributions',
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

/**
 * Subscription pool status values
 */
export const POOL_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
} as const;

export type PoolStatus = typeof POOL_STATUS[keyof typeof POOL_STATUS];

/**
 * Pool membership status values
 */
export const POOL_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  LEFT: 'left',
  PENDING: 'pending',
} as const;

export type PoolMembershipStatus = typeof POOL_MEMBERSHIP_STATUS[keyof typeof POOL_MEMBERSHIP_STATUS];
