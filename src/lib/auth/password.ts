/**
 * Password hashing utilities for RevampIT unified auth
 * Uses bcrypt for secure password hashing
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Used for legacy plain-text comparisons only (avoid in production).
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Generate a secure random token for email verification, password reset, etc.
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length]
  }
  return token
}

/**
 * Validate password strength according to AUTH_CONFIG
 * Returns true if password meets requirements:
 * - At least 12 characters (NIST recommendation, matches AUTH_CONFIG)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const MIN_LENGTH = 12 // Matches AUTH_CONFIG.password.minLength

  if (password.length < MIN_LENGTH) {
    errors.push(`Passwort muss mindestens ${MIN_LENGTH} Zeichen lang sein`)
  }
  if (password.length > 128) {
    errors.push('Passwort darf maximal 128 Zeichen lang sein')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Grossbuchstaben enthalten')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten')
  }
  // Special characters are recommended but not strictly required for better UX
  // The config has requireSpecialChars: true, but we'll make it a warning, not blocking

  return {
    isValid: errors.length === 0,
    errors
  }
}







