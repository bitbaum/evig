/**
 * Shared constants for the application
 * These are safe to import in both client and server code
 */

// Define user roles and their permissions
export const ROLES = {
  // Organization Roles (auto-assigned by email domain)
  REVAMPIT_SUPER_ADMIN: 'revampit_super_admin',    // CEO/Founders - full system access
  REVAMPIT_ADMIN: 'revampit_admin',                // RevampIT staff - comprehensive admin access
  REVAMPIT_EDITOR: 'revampit_editor',              // Content editors - content management
  REVAMPIT_SUPPORT: 'revampit_support',            // Support staff - customer service access

  // Business Partner Roles
  PARTNER_ADMIN: 'partner_admin',                  // Business partners with admin access
  PARTNER_STAFF: 'partner_staff',                  // Partner staff with limited access

  // Hirn Dashboard Roles (internal analytics & reporting)
  HIRN_ADMIN: 'hirn_admin',                        // Full Hirn access - finances, KPIs, all data
  HIRN_USER: 'hirn_user',                          // Hirn read access - view dashboards, reports

  // Community Roles (user-requested)
  MODERATOR: 'moderator',                          // Community moderators with approval rights
  SELLER: 'seller',                                 // Users who sell refurbished products
  REPAIRER: 'repairer',                            // Users who offer repair services
  TECHNICAL_EXPERT: 'technical_expert',            // Community experts who help others

  // Customer Roles
  PREMIUM_CUSTOMER: 'premium_customer',            // High-value customers with perks
  VERIFIED_CUSTOMER: 'verified_customer',          // Verified customers with enhanced trust
  CUSTOMER: 'customer'                             // Regular customers
} as const

// Email Domain-based Role Assignment
export const EMAIL_DOMAIN_ROLES: Record<string, UserRole> = {
  'revamp-it.ch': ROLES.REVAMPIT_ADMIN,      // Default for all @revamp-it.ch emails
  // Specific assignments can be added here
  // 'partner-company.ch': ROLES.PARTNER_ADMIN,
}

// Role Assignment Rules
export function determineUserRole(email: string, additionalFactors?: {
  isPremium?: boolean
  hasSellerInterest?: boolean
  hasRepairInterest?: boolean
  isVerified?: boolean
}): UserRole {
  const domain = email.split('@')[1]?.toLowerCase()

  // 1. Organization emails get automatic admin roles
  if (EMAIL_DOMAIN_ROLES[domain]) {
    return EMAIL_DOMAIN_ROLES[domain]
  }

  // 2. Special organization assignments
  if (domain === 'revamp-it.ch') {
    // Could add logic for different admin levels based on email patterns
    // e.g., founders@revamp-it.ch -> REVAMPIT_SUPER_ADMIN
    if (email.includes('founder') || email.includes('ceo') || email.includes('admin')) {
      return ROLES.REVAMPIT_SUPER_ADMIN
    }
    if (email.includes('editor') || email.includes('content')) {
      return ROLES.REVAMPIT_EDITOR
    }
    if (email.includes('support') || email.includes('help')) {
      return ROLES.REVAMPIT_SUPPORT
    }
    // Default for all other @revamp-it.ch emails
    return ROLES.REVAMPIT_ADMIN
  }

  // 3. Business partner domains
  // Add logic here for partner companies

  // 4. Premium/Verified customers
  if (additionalFactors?.isPremium) {
    return ROLES.PREMIUM_CUSTOMER
  }
  if (additionalFactors?.isVerified) {
    return ROLES.VERIFIED_CUSTOMER
  }

  // 5. Community roles (require application/verification)
  if (additionalFactors?.hasSellerInterest) {
    return ROLES.SELLER // Note: This should be pending verification
  }
  if (additionalFactors?.hasRepairInterest) {
    return ROLES.REPAIRER // Note: This should be pending verification
  }

  // 6. Default to regular customer
  return ROLES.CUSTOMER
}

// Role Display Names (for UI)
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [ROLES.REVAMPIT_SUPER_ADMIN]: 'Super Administrator',
  [ROLES.REVAMPIT_ADMIN]: 'RevampIT Administrator',
  [ROLES.REVAMPIT_EDITOR]: 'Content Editor',
  [ROLES.REVAMPIT_SUPPORT]: 'Support Specialist',
  [ROLES.HIRN_ADMIN]: 'Hirn Administrator',
  [ROLES.HIRN_USER]: 'Hirn Benutzer',
  [ROLES.PARTNER_ADMIN]: 'Partner Administrator',
  [ROLES.PARTNER_STAFF]: 'Partner Staff',
  [ROLES.MODERATOR]: 'Community Moderator',
  [ROLES.SELLER]: 'Marketplace Seller',
  [ROLES.REPAIRER]: 'Service Provider',
  [ROLES.TECHNICAL_EXPERT]: 'Technical Expert',
  [ROLES.PREMIUM_CUSTOMER]: 'Premium Customer',
  [ROLES.VERIFIED_CUSTOMER]: 'Verified Customer',
  [ROLES.CUSTOMER]: 'Customer'
}

// Role Descriptions (for UI)
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [ROLES.REVAMPIT_SUPER_ADMIN]: 'Complete system access and control',
  [ROLES.REVAMPIT_ADMIN]: 'Comprehensive administrative access',
  [ROLES.REVAMPIT_EDITOR]: 'Content creation and management',
  [ROLES.REVAMPIT_SUPPORT]: 'Customer service and support',
  [ROLES.HIRN_ADMIN]: 'Full Hirn dashboard access - finances, KPIs, analytics',
  [ROLES.HIRN_USER]: 'Hirn dashboard read access - view reports and dashboards',
  [ROLES.PARTNER_ADMIN]: 'Business partner administration',
  [ROLES.PARTNER_STAFF]: 'Partner staff access',
  [ROLES.MODERATOR]: 'Moderate community content and approve submissions',
  [ROLES.SELLER]: 'Sell refurbished products on marketplace',
  [ROLES.REPAIRER]: 'Offer repair services to customers',
  [ROLES.TECHNICAL_EXPERT]: 'Provide technical assistance',
  [ROLES.PREMIUM_CUSTOMER]: 'Enhanced customer experience',
  [ROLES.VERIFIED_CUSTOMER]: 'Verified customer with trust indicators',
  [ROLES.CUSTOMER]: 'Standard customer access'
}

export type UserRole = typeof ROLES[keyof typeof ROLES]

/**
 * Helper to check if a role has admin privileges
 * Handles both new role format (revampit_admin) and legacy 'admin' role
 */
export function isAdminRole(role: string | undefined | null): boolean {
  if (!role) return false
  return role === ROLES.REVAMPIT_ADMIN ||
         role === ROLES.REVAMPIT_SUPER_ADMIN ||
         role === 'admin' ||  // Legacy role value
         role === 'REVAMPIT_ADMIN'  // Uppercase variant
}

/**
 * Admin role values for database queries
 * Use this for role comparisons in SQL or when checking user roles
 */
export const ADMIN_ROLES = [
  ROLES.REVAMPIT_ADMIN,
  ROLES.REVAMPIT_SUPER_ADMIN,
  'admin',  // Legacy
  'REVAMPIT_ADMIN',  // Uppercase variant
] as const

/**
 * Hirn dashboard role values
 * Roles that have access to the Hirn dashboard
 */
export const HIRN_ROLES = [
  ROLES.REVAMPIT_SUPER_ADMIN,
  ROLES.REVAMPIT_ADMIN,
  ROLES.HIRN_ADMIN,
  ROLES.HIRN_USER,
] as const

/**
 * Helper to check if a role has Hirn dashboard access
 */
export function hasHirnAccess(role: string | undefined | null): boolean {
  if (!role) return false
  return HIRN_ROLES.includes(role as typeof HIRN_ROLES[number])
}

export const PERMISSIONS = {
  // System Administration
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SYSTEM_CONFIG: 'manage_system_config',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  MANAGE_BACKUPS: 'manage_backups',

  // Content Management
  MANAGE_CONTENT: 'manage_content',
  MANAGE_BLOG: 'manage_blog',
  MANAGE_WORKSHOPS: 'manage_workshops',
  MANAGE_PAGES: 'manage_pages',
  MODERATE_COMMENTS: 'moderate_comments',

  // Commerce Management
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_ORDERS: 'manage_orders',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_SHIPPING: 'manage_shipping',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_ANALYTICS: 'view_analytics',

  // Customer Service
  VIEW_CUSTOMER_DATA: 'view_customer_data',
  MANAGE_CUSTOMER_SUPPORT: 'manage_customer_support',
  PROCESS_REFUNDS: 'process_refunds',
  VIEW_ORDER_HISTORY: 'view_order_history',

  // Marketplace Permissions
  SELL_PRODUCTS: 'sell_products',
  MANAGE_OWN_PRODUCTS: 'manage_own_products',
  VIEW_OWN_SALES: 'view_own_sales',
  MARKETPLACE_LISTING: 'marketplace_listing',

  // Service Provider Permissions
  OFFER_REPAIRS: 'offer_repairs',
  MANAGE_REPAIR_PROFILE: 'manage_repair_profile',
  VIEW_REPAIR_BOOKINGS: 'view_repair_bookings',
  TECHNICAL_CERTIFICATION: 'technical_certification',

  // Community Permissions
  CREATE_CONTENT: 'create_content',
  MODERATE_FORUM: 'moderate_forum',
  TECHNICAL_SUPPORT: 'technical_support',
  COMMUNITY_LEAD: 'community_lead',

  // Customer Permissions
  BUY_PRODUCTS: 'buy_products',
  BOOK_WORKSHOPS: 'book_workshops',
  BOOK_REPAIRS: 'book_repairs',
  LEAVE_REVIEWS: 'leave_reviews',
  PREMIUM_SUPPORT: 'premium_support',
  EARLY_ACCESS: 'early_access',

  // Hirn Dashboard Permissions
  VIEW_HIRN_DASHBOARD: 'view_hirn_dashboard',      // View Hirn overview dashboard
  VIEW_HIRN_FINANZEN: 'view_hirn_finanzen',        // View financial data and reports
  VIEW_HIRN_KENNZAHLEN: 'view_hirn_kennzahlen',    // View KPIs and metrics
  VIEW_HIRN_WIRKUNG: 'view_hirn_wirkung',          // View impact reports
  VIEW_HIRN_TRANSPARENZ: 'view_hirn_transparenz',  // View transparency reports
  MANAGE_HIRN_DATA: 'manage_hirn_data',            // Edit/manage Hirn data sources
  EXPORT_HIRN_REPORTS: 'export_hirn_reports',      // Export reports and analytics
} as const

// Contact information
export const CONTACT_EMAIL = 'empfang@revamp-it.ch'

// Shop URLs and locations
export const SHOP_ONLINE_URL = 'https://revamp-it.ch/shop'
export const SHOPWARE_URL = 'https://revamp-it.ch/shop-sw'
export const STORE_ADDRESS = 'Hohlstrasse 89, 8004 Zürich'
export const STORE_GOOGLE_MAPS_URL = 'https://maps.google.com/?q=Hohlstrasse+89+8004+Zürich'
export const STORE_OSM_URL = 'https://www.openstreetmap.org/?mlat=47.378&mlon=8.527#map=17/47.378/8.527'
export const WAREHOUSE_GOOGLE_MAPS_URL = 'https://maps.google.com/?q=Hohlstrasse+89+8004+Zürich'
export const WAREHOUSE_OSM_URL = 'https://www.openstreetmap.org/?mlat=47.378&mlon=8.527#map=17/47.378/8.527'

// Role permissions mapping - comprehensive RBAC system
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // Organization Roles - Auto-assigned by @revamp-it.ch email
  [ROLES.REVAMPIT_SUPER_ADMIN]: [
    // All permissions - complete system access (including all Hirn)
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.REVAMPIT_ADMIN]: [
    // Comprehensive admin access except system-level operations
    PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ROLES, PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_WORKSHOPS, PERMISSIONS.MANAGE_SHIPPING, PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_SYSTEM_LOGS, PERMISSIONS.MANAGE_BACKUPS,
    PERMISSIONS.MANAGE_CUSTOMER_SUPPORT, PERMISSIONS.PROCESS_REFUNDS,
    PERMISSIONS.SELL_PRODUCTS, PERMISSIONS.MANAGE_OWN_PRODUCTS, PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    // Full Hirn access for RevampIT admins
    PERMISSIONS.VIEW_HIRN_DASHBOARD, PERMISSIONS.VIEW_HIRN_FINANZEN,
    PERMISSIONS.VIEW_HIRN_KENNZAHLEN, PERMISSIONS.VIEW_HIRN_WIRKUNG,
    PERMISSIONS.VIEW_HIRN_TRANSPARENZ, PERMISSIONS.MANAGE_HIRN_DATA,
    PERMISSIONS.EXPORT_HIRN_REPORTS
  ],
  [ROLES.REVAMPIT_EDITOR]: [
    // Content-focused admin access
    PERMISSIONS.MANAGE_CONTENT, PERMISSIONS.MANAGE_BLOG, PERMISSIONS.MANAGE_WORKSHOPS,
    PERMISSIONS.MANAGE_PAGES, PERMISSIONS.MODERATE_COMMENTS, PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS
  ],
  [ROLES.REVAMPIT_SUPPORT]: [
    // Customer service focused access
    PERMISSIONS.VIEW_CUSTOMER_DATA, PERMISSIONS.MANAGE_CUSTOMER_SUPPORT,
    PERMISSIONS.VIEW_ORDER_HISTORY, PERMISSIONS.PROCESS_REFUNDS,
    PERMISSIONS.TECHNICAL_SUPPORT, PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS
  ],

  // Hirn Dashboard Roles
  [ROLES.HIRN_ADMIN]: [
    // Full Hirn access - manage data, export reports
    PERMISSIONS.VIEW_HIRN_DASHBOARD, PERMISSIONS.VIEW_HIRN_FINANZEN,
    PERMISSIONS.VIEW_HIRN_KENNZAHLEN, PERMISSIONS.VIEW_HIRN_WIRKUNG,
    PERMISSIONS.VIEW_HIRN_TRANSPARENZ, PERMISSIONS.MANAGE_HIRN_DATA,
    PERMISSIONS.EXPORT_HIRN_REPORTS,
    // Basic user permissions
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],
  [ROLES.HIRN_USER]: [
    // Hirn read-only access
    PERMISSIONS.VIEW_HIRN_DASHBOARD, PERMISSIONS.VIEW_HIRN_FINANZEN,
    PERMISSIONS.VIEW_HIRN_KENNZAHLEN, PERMISSIONS.VIEW_HIRN_WIRKUNG,
    PERMISSIONS.VIEW_HIRN_TRANSPARENZ,
    // Basic user permissions
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],

  // Business Partner Roles
  [ROLES.PARTNER_ADMIN]: [
    // Limited admin access for business partners
    PERMISSIONS.MANAGE_OWN_PRODUCTS, PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.VIEW_ORDER_HISTORY, PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS
  ],
  [ROLES.PARTNER_STAFF]: [
    // Basic partner access
    PERMISSIONS.VIEW_OWN_SALES, PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS
  ],

  // Community Roles - User-requested and verified
  [ROLES.MODERATOR]: [
    // Community moderation permissions
    PERMISSIONS.MODERATE_COMMENTS, PERMISSIONS.MODERATE_FORUM,
    PERMISSIONS.MANAGE_CONTENT, PERMISSIONS.VIEW_CUSTOMER_DATA,
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],
  [ROLES.SELLER]: [
    // Marketplace seller permissions
    PERMISSIONS.SELL_PRODUCTS, PERMISSIONS.MANAGE_OWN_PRODUCTS,
    PERMISSIONS.VIEW_OWN_SALES, PERMISSIONS.MARKETPLACE_LISTING,
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],
  [ROLES.REPAIRER]: [
    // Service provider permissions
    PERMISSIONS.OFFER_REPAIRS, PERMISSIONS.MANAGE_REPAIR_PROFILE,
    PERMISSIONS.VIEW_REPAIR_BOOKINGS, PERMISSIONS.TECHNICAL_CERTIFICATION,
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],
  [ROLES.TECHNICAL_EXPERT]: [
    // Community expert permissions
    PERMISSIONS.TECHNICAL_SUPPORT, PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.MODERATE_FORUM, PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS, PERMISSIONS.LEAVE_REVIEWS
  ],

  // Customer Roles
  [ROLES.PREMIUM_CUSTOMER]: [
    // Enhanced customer experience
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS, PERMISSIONS.PREMIUM_SUPPORT, PERMISSIONS.EARLY_ACCESS
  ],
  [ROLES.VERIFIED_CUSTOMER]: [
    // Trust-enhanced customer
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS, PERMISSIONS.PREMIUM_SUPPORT
  ],
  [ROLES.CUSTOMER]: [
    // Standard customer permissions
    PERMISSIONS.BUY_PRODUCTS, PERMISSIONS.BOOK_WORKSHOPS, PERMISSIONS.BOOK_REPAIRS,
    PERMISSIONS.LEAVE_REVIEWS
  ],
}