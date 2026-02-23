import { serialize, parse } from 'cookie'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, constantTimeCompare } from './auth/password'
import { getJwtSecret, AUTH_CONFIG, validateAdminPasswordConfig } from './auth/config'
import { REDIS_CONFIG } from '@/config/redis'
import {
  checkRateLimit,
  recordFailedAttempt,
  isAccountLocked,
  resetLockout,
  getClientIp,
  checkRateLimitRedis,
  recordFailedAttemptRedis,
  isAccountLockedRedis,
  resetLockoutRedis,
} from './auth/rate-limiter'
import {
  logLoginSuccess,
  logLoginFailure,
  logAccountLocked,
  logRateLimitExceeded,
} from './auth/audit'
import { logger } from '@/lib/logger'

// Re-export for backwards compatibility
export { getJwtSecret }

// =============================================================================
// Lazy Validation (only on first use, not during build)
// =============================================================================

let passwordConfigValidated = false

/**
 * Validate admin password configuration lazily
 * Only runs on first actual use, not during module load/build
 */
function ensurePasswordConfigValid(): void {
  if (passwordConfigValidated) return
  passwordConfigValidated = true

  const validation = validateAdminPasswordConfig()
  if (!validation.valid) {
    logger.error('Admin password configuration error', { error: validation.error })
    // In production, this is a fatal error
    if (process.env.NODE_ENV === 'production') {
      throw new Error(validation.error)
    }
  } else if (validation.warning) {
    logger.warn(validation.warning)
  }
}

/**
 * Get admin password hash from environment
 * For security, store the bcrypt hash, not the plain password
 */
export function getAdminPasswordHash(): string | null {
  // First check for hashed password (preferred)
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (hash) return hash

  // Fallback to plain password (will be hashed at runtime)
  // This is for backwards compatibility - migrate to hash ASAP
  return null
}

/**
 * Get plain admin password (legacy, for migration only)
 * @deprecated Use ADMIN_PASSWORD_HASH instead
 */
export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is required')
  }
  return password
}

export interface AdminUser {
  id: string
  email: string
  role: 'admin'
  loginTime: number
  tokenVersion?: number  // For token rotation
}

/**
 * Verify admin password with bcrypt
 * Supports both hashed (secure) and plain (legacy) password comparison
 */
export async function verifyAdminPassword(
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  valid: boolean
  error?: string
  retryAfter?: number
}> {
  // Validate config on first actual use (not during build)
  ensurePasswordConfigValid()

  const identifier = 'admin'
  const ctx = {
    userId: 'admin-1',
    email: 'admin@revampit.ch',
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
  }

  // Check rate limit
  const useRedis = REDIS_CONFIG.ENABLE_RATE_LIMITER
  const rateLimit = useRedis
    ? await checkRateLimitRedis(ipAddress || 'admin', 'login')
    : checkRateLimit(ipAddress || 'admin', 'login')
  if (!rateLimit.allowed) {
    logRateLimitExceeded(ctx, 'admin_login', AUTH_CONFIG.rateLimit.login.maxAttempts)
    return {
      valid: false,
      error: 'Zu viele Anmeldeversuche. Bitte warten Sie.',
      retryAfter: rateLimit.retryAfter,
    }
  }

  // Check account lockout
  const lockout = useRedis
    ? await isAccountLockedRedis(identifier)
    : isAccountLocked(identifier)
  if (lockout.locked) {
    return {
      valid: false,
      error: 'Konto vorübergehend gesperrt. Bitte versuchen Sie es später erneut.',
      retryAfter: lockout.retryAfter,
    }
  }

  try {
    const hash = getAdminPasswordHash()

    let isValid = false

    if (hash) {
      // Use bcrypt verification (secure)
      isValid = await verifyPassword(password, hash)
    } else {
      // Fallback to constant-time plain comparison (legacy)
      // Log a warning - this should be migrated
      logger.warn(
        '[SECURITY WARNING] Using plain text admin password comparison. ' +
        'Please set ADMIN_PASSWORD_HASH with a bcrypt hash instead.'
      )
      const plainPassword = getAdminPassword()
      isValid = constantTimeCompare(password, plainPassword)
    }

    if (!isValid) {
      // Record failed attempt
      const lockoutResult = useRedis
        ? await recordFailedAttemptRedis(identifier)
        : recordFailedAttempt(identifier)
      logLoginFailure(ctx, 'invalid_password')

      if (lockoutResult.locked) {
        logAccountLocked(ctx, lockoutResult.retryAfter! * 1000)
        return {
          valid: false,
          error: 'Konto vorübergehend gesperrt nach mehreren Fehlversuchen.',
          retryAfter: lockoutResult.retryAfter,
        }
      }

      return {
        valid: false,
        error: `Falsches Passwort. ${lockoutResult.remainingAttempts} Versuche verbleibend.`,
      }
    }

    // Success - reset lockout
    if (useRedis) {
      await resetLockoutRedis(identifier)
    } else {
      resetLockout(identifier)
    }
    logLoginSuccess(ctx)

    return { valid: true }
  } catch (error) {
    logger.error('Admin password verification error', { error })
    return {
      valid: false,
      error: 'Authentifizierungsfehler. Bitte versuchen Sie es erneut.',
    }
  }
}

export function createAdminToken(email: string = 'admin@revampit.ch'): string {
  const payload: AdminUser = {
    id: 'admin-1',
    email,
    role: 'admin',
    loginTime: Date.now()
  }

  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminUser
    return decoded
  } catch (error) {
    return null
  }
}

export function createAuthCookie(token: string): string {
  return serialize('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/admin'
  })
}

export function getTokenFromCookies(cookieHeader?: string): string | null {
  if (!cookieHeader) return null
  
  const cookies = parse(cookieHeader)
  return cookies['admin-token'] || null
}

export function clearAuthCookie(): string {
  return serialize('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/admin'
  })
}

// Extended NextRequest interface
export interface AuthenticatedNextRequest extends NextRequest {
  adminUser: AdminUser
}

// Middleware function for App Router API routes
export function requireAdminAuth(handler: (request: AuthenticatedNextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = getTokenFromCookies(request.headers.get('cookie') || undefined)

    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const adminUser = verifyAdminToken(token)

    if (!adminUser) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Add admin user to request
    const authenticatedRequest = request as AuthenticatedNextRequest
    authenticatedRequest.adminUser = adminUser

    return handler(authenticatedRequest)
  }
}
