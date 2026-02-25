/**
 * RevampIT Authentication Module
 *
 * State-of-the-art authentication with:
 * - Bcrypt password hashing (12 rounds)
 * - JWT with refresh token rotation
 * - Rate limiting and account lockout
 * - Comprehensive audit logging
 * - CSRF protection
 * - Strong password policy
 * - Breach detection via HaveIBeenPwned
 *
 * @module auth
 */

// Configuration
export {
  AUTH_CONFIG,
  getJwtSecret,
  getAuthSecret,
  getDbConfig,
  UNIFIED_ROLES,
  ROLE_HIERARCHY,
  hasMinimumRole,
  type UserRole,
} from './config'

// Password utilities
export {
  hashPassword,
  verifyPassword,
  constantTimeCompare,
  generateToken,
  validatePasswordStrength,
} from './password'

// Rate limiting and lockout
export {
  checkRateLimit,
  resetRateLimit,
  recordFailedAttempt,
  isAccountLocked,
  resetLockout,
  clearFailedAttempts,
  recordFailedAttemptDb,
  clearLockoutDb,
  getClientIp,
  createRateLimitKey,
  type RateLimitType,
} from './rate-limiter'

// Audit logging
export {
  logAuditEvent,
  logAuditEventSync,
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logRegistration,
  logPasswordChange,
  logAccountLocked,
  logRateLimitExceeded,
  logSuspiciousActivity,
  logRoleChange,
  logAdminAction,
  queryAuditLogs,
  getRecentSuspiciousActivity,
  getFailedLoginAttempts,
  type AuditEventType,
  type AuditLogEntry,
} from './audit'

// CSRF protection
export {
  generateCsrfToken,
  validateCsrf,
  withCsrfProtection,
  handleCsrfTokenRequest,
  csrfMiddleware,
  createCsrfCookie,
  getCsrfFromCookies,
  CSRF_SCRIPT,
} from './csrf'

// Database utilities (re-export commonly used)
export {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  createVerificationToken,
  verifyEmailWithToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  updateUserPassword,
  userHasPermission,
  updateUserLastActivity,
  getUserWithProfile,
  type DbUser,
  type DbUserProfile,
} from './db'
