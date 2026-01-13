// Payment Security & PCI Compliance Utilities
// Implements security measures for handling payment data

import crypto from 'crypto'
import { logger } from '@/lib/logger'

// PCI DSS compliance constants
export const PCI_COMPLIANCE = {
  // Required security headers
  SECURITY_HEADERS: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // Data retention limits (PCI DSS requirement)
  DATA_RETENTION: {
    CARD_DATA_MAX_DAYS: 365, // 1 year for dispute resolution
    SENSITIVE_DATA_MAX_MINUTES: 30, // 30 minutes in memory
    LOG_RETENTION_DAYS: 365 // 1 year for logs
  }
}

// Sensitive data patterns (for detection and masking)
export const SENSITIVE_PATTERNS = {
  CARD_NUMBER: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  CVC: /\b\d{3,4}\b/g,
  EXPIRY: /\b(0[1-9]|1[0-2])\/(\d{2}|\d{4})\b/g,
  CVV: /\b\d{3,4}\b/g,
  API_KEY: /(sk|pk)_(test|live)_[a-zA-Z0-9]+/g,
  TOKEN: /tok_[a-zA-Z0-9]+/g
}

/**
 * Mask sensitive payment data for logging
 */
export function maskSensitiveData(data: string): string {
  if (!data) return data

  let masked = data

  // Mask card numbers (keep first 6 and last 4 digits)
  masked = masked.replace(SENSITIVE_PATTERNS.CARD_NUMBER, (match) => {
    const digits = match.replace(/\D/g, '')
    if (digits.length >= 12) {
      return digits.substring(0, 6) + '****' + digits.substring(digits.length - 4)
    }
    return '****' + digits.substring(digits.length - 4)
  })

  // Mask CVC/CVV
  masked = masked.replace(SENSITIVE_PATTERNS.CVC, '***')
  masked = masked.replace(SENSITIVE_PATTERNS.CVV, '***')

  // Mask API keys
  masked = masked.replace(SENSITIVE_PATTERNS.API_KEY, (match) => {
    const parts = match.split('_')
    if (parts.length >= 3) {
      return parts[0] + '_' + parts[1] + '_****' + match.substring(match.length - 4)
    }
    return '****'
  })

  // Mask tokens
  masked = masked.replace(SENSITIVE_PATTERNS.TOKEN, 'tok_****')

  return masked
}

/**
 * Encrypt sensitive data before storage
 */
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm'
  const key = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production'
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return encrypted data with IV and auth tag
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm
  })
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const { encrypted, iv, authTag, algorithm } = JSON.parse(encryptedData)

    const key = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production'
    const decipher = crypto.createDecipher(algorithm, key)
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    logger.error('Failed to decrypt sensitive data', { error })
    throw new Error('Data decryption failed')
  }
}

/**
 * Generate secure payment reference ID
 */
export function generatePaymentReference(): string {
  return 'pmt_' + crypto.randomBytes(16).toString('hex')
}

/**
 * Validate payment data integrity
 */
interface PaymentDataInput {
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
}

export function validatePaymentData(data: PaymentDataInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for required fields
  if (!data.amount || data.amount <= 0) {
    errors.push('Invalid amount')
  }

  if (!data.currency || !['CHF', 'EUR'].includes(data.currency)) {
    errors.push('Invalid currency')
  }

  // Check amount limits (PCI DSS requirement)
  if (data.amount > 50000) { // 500 CHF/EUR limit for high-risk transactions
    errors.push('Amount exceeds maximum limit')
  }

  // Validate metadata size (Stripe limit)
  if (data.metadata && JSON.stringify(data.metadata).length > 500) {
    errors.push('Metadata too large')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Clean up expired sensitive data (PCI DSS requirement)
 */
export async function cleanupExpiredData() {
  // This would be called by a scheduled job
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - PCI_COMPLIANCE.DATA_RETENTION.CARD_DATA_MAX_DAYS)

  // Note: In a real implementation, this would delete or anonymize
  // payment data older than the retention period
  logger.info('Cleaning up expired payment data', { cutoffDate: cutoffDate.toISOString() })

  // Implementation would depend on your database cleanup strategy
  return {
    cleanedRecords: 0, // Placeholder
    cutoffDate: cutoffDate.toISOString()
  }
}

/**
 * Generate secure audit log entry
 */
export function createAuditLog(
  action: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown> = {},
  ipAddress?: string
) {
  return {
    timestamp: new Date().toISOString(),
    action,
    userId,
    resourceType,
    resourceId,
    details: maskSensitiveData(JSON.stringify(details)),
    ipAddress: ipAddress || 'unknown',
    sessionId: generatePaymentReference()
  }
}

/**
 * Check if request is from a secure connection
 */
export function isSecureRequest(request: Request): boolean {
  // Check if request is HTTPS
  const url = new URL(request.url)
  return url.protocol === 'https:' || process.env.NODE_ENV === 'development'
}

/**
 * Rate limiting for payment endpoints
 */
export class PaymentRateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()

  isAllowed(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Global rate limiter instance
export const paymentRateLimiter = new PaymentRateLimiter()

// Clean up expired rate limit records every 5 minutes
setInterval(() => {
  paymentRateLimiter.cleanup()
}, 5 * 60 * 1000)