/**
 * Auth Configuration - State of the Art Security Settings
 *
 * Centralized configuration for all authentication-related settings.
 * Follows OWASP best practices and modern security standards.
 */

// =============================================================================
// Environment Variable Validators
// =============================================================================

/**
 * Get required environment variable or throw descriptive error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not set. ` +
      `Please add it to your .env file or environment configuration.`
    )
  }
  return value
}

/**
 * Get optional environment variable with fallback
 * Note: Only use for non-sensitive configuration
 */
export function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback
}

// =============================================================================
// Security Configuration
// =============================================================================

export const AUTH_CONFIG = {
  // Password hashing
  bcrypt: {
    saltRounds: 12, // OWASP recommends 10-12 for bcrypt
  },

  // JWT settings
  jwt: {
    accessTokenExpiry: '15m',     // Short-lived access tokens
    refreshTokenExpiry: '7d',      // Longer refresh tokens
    adminTokenExpiry: '24h',       // Admin session duration
    algorithm: 'HS256' as const,
  },

  // Session settings
  session: {
    maxAge: 30 * 24 * 60 * 60,     // 30 days
    updateAge: 24 * 60 * 60,       // Refresh every 24 hours
  },

  // Password policy
  password: {
    minLength: 12,                  // NIST recommends 8+, we use 12
    maxLength: 128,                 // Prevent DoS via long passwords
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*(),.?":{}|<>[]\\;\'`~_+-=',
  },

  // Rate limiting
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000,    // 15 minutes
      maxAttempts: 5,               // 5 attempts per window
      blockDuration: 30 * 60 * 1000, // 30 minute block after max attempts
    },
    register: {
      windowMs: 60 * 60 * 1000,    // 1 hour
      maxAttempts: 5,               // 5 registrations per hour
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,    // 1 hour
      maxAttempts: 3,               // 3 attempts per hour
    },
    newsletter: {
      windowMs: 60 * 60 * 1000,    // 1 hour
      maxAttempts: 5,               // 5 subscriptions per hour per IP
    },
    submission: {
      windowMs: 60 * 60 * 1000,    // 1 hour
      maxAttempts: 10,              // 10 submissions per hour per IP
    },
  },

  // Account lockout
  lockout: {
    maxFailedAttempts: 5,           // Lock after 5 failed attempts
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    progressiveLockout: true,       // Double lockout on repeated lockouts
  },

  // Token expiration
  tokens: {
    emailVerification: 24 * 60 * 60 * 1000, // 24 hours
    passwordReset: 60 * 60 * 1000,          // 1 hour
    magicLink: 15 * 60 * 1000,              // 15 minutes
  },

  // Cookie settings
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  },

  // Security headers
  headers: {
    hsts: {
      maxAge: 31536000,             // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },
} as const

// =============================================================================
// Lazy Getters for Sensitive Environment Variables
// =============================================================================

/**
 * Get JWT secret - validates at runtime, not build time
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
      'Generate a secure secret: openssl rand -base64 64'
    )
  }

  // Validate minimum secret length (256 bits = 32 bytes)
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security. ' +
      'Generate a secure secret: openssl rand -base64 64'
    )
  }

  return secret
}

/**
 * Get Auth.js secret
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      'AUTH_SECRET environment variable is required for Auth.js. ' +
      'Generate a secure secret: openssl rand -base64 64'
    )
  }
  return secret
}

/**
 * Get database configuration
 */
export function getDbConfig() {
  const sslEnabled = process.env.DB_SSL !== 'false'

  return {
    host: process.env.AUTH_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.AUTH_DB_PORT || process.env.DB_PORT || '5433'),
    database: process.env.AUTH_DB_NAME || process.env.DB_NAME || 'revampit_cms',
    user: process.env.AUTH_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }
}

/**
 * Get Medusa API configuration
 * Throws if required keys are not set (no hardcoded fallbacks!)
 */
export function getMedusaConfig() {
  const backendUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const adminApiKey = process.env.MEDUSA_ADMIN_API_KEY

  // Use URL config for SSOT compliance (synchronous import)
  const { MEDUSA_API_URL } = require('@/config/urls')
  
  return {
    backendUrl: backendUrl || MEDUSA_API_URL,
    publishableKey,
    adminApiKey,
    isConfigured: !!(publishableKey && backendUrl),
  }
}

// =============================================================================
// Role Definitions (Single Source of Truth)
// =============================================================================

export const UNIFIED_ROLES = {
  // Public users
  USER: 'user',
  CUSTOMER: 'customer',

  // Platform participants
  SUPPORTER: 'supporter',
  REPAIRER: 'repairer',

  // Staff
  EMPLOYEE: 'employee',
  EDITOR: 'editor',

  // Administrators
  ADMIN: 'admin',
  REVAMPIT_ADMIN: 'revampit_admin',
  SUPER_ADMIN: 'super_admin',
} as const

export type UserRole = typeof UNIFIED_ROLES[keyof typeof UNIFIED_ROLES]

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: UserRole[] = [
  UNIFIED_ROLES.USER,
  UNIFIED_ROLES.CUSTOMER,
  UNIFIED_ROLES.SUPPORTER,
  UNIFIED_ROLES.REPAIRER,
  UNIFIED_ROLES.EMPLOYEE,
  UNIFIED_ROLES.EDITOR,
  UNIFIED_ROLES.ADMIN,
  UNIFIED_ROLES.REVAMPIT_ADMIN,
  UNIFIED_ROLES.SUPER_ADMIN,
]

/**
 * Check if a role has at least the same privileges as another role
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex >= requiredIndex
}

// =============================================================================
// Admin Password Security
// =============================================================================

/**
 * Validate admin password configuration
 * In production, ADMIN_PASSWORD_HASH is required (plain text not allowed)
 */
export function validateAdminPasswordConfig(): {
  valid: boolean
  error?: string
  warning?: string
} {
  const hash = process.env.ADMIN_PASSWORD_HASH
  const plainPassword = process.env.ADMIN_PASSWORD
  const isProduction = process.env.NODE_ENV === 'production'

  // Check if using hashed password (preferred)
  if (hash) {
    // Validate it looks like a bcrypt hash
    if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
      return {
        valid: false,
        error: 'ADMIN_PASSWORD_HASH does not appear to be a valid bcrypt hash. ' +
               'Generate one using: npx bcrypt-cli hash "your-password" 12'
      }
    }
    return { valid: true }
  }

  // No hash configured - check for plain password
  if (!plainPassword) {
    return {
      valid: false,
      error: 'Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is configured. ' +
             'Set ADMIN_PASSWORD_HASH with a bcrypt hash for secure admin authentication.'
    }
  }

  // Plain password in production is NOT allowed
  if (isProduction) {
    return {
      valid: false,
      error: 'SECURITY ERROR: Plain text admin password (ADMIN_PASSWORD) is not allowed in production. ' +
             'Set ADMIN_PASSWORD_HASH instead. Generate hash: npx bcrypt-cli hash "your-password" 12'
    }
  }

  // Plain password in development - warn but allow
  return {
    valid: true,
    warning: 'SECURITY WARNING: Using plain text ADMIN_PASSWORD. ' +
             'This is only acceptable in development. ' +
             'For production, set ADMIN_PASSWORD_HASH instead.'
  }
}
