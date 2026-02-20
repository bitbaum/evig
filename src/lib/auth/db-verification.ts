/**
 * Email verification and password reset database queries
 */

import { randomBytes } from 'crypto'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { query, getUserColumns } from './db-connection'

// ============================================================================
// Email verification functions
// ============================================================================

export interface DbVerificationToken {
  identifier: string
  token: string
  expires: Date
}

/**
 * Create a verification token for email verification
 */
export async function createVerificationToken(email: string): Promise<string> {
  // Generate a secure random token
  const token = randomBytes(32).toString('hex')

  // Set expiration to 24 hours from now
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await query(
    `INSERT INTO ${TABLE_NAMES.VERIFICATION_TOKENS} (identifier, token, expires)
     VALUES ($1, $2, $3)
     ON CONFLICT (identifier, token) DO UPDATE SET
       expires = EXCLUDED.expires`,
    [email, token, expires]
  )

  return token
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string): Promise<{ success: boolean, email?: string, error?: string }> {
  try {
    const result = await query<DbVerificationToken>(
      `SELECT * FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE token = $1 AND expires > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Token' }
    }

    const verificationToken = result.rows[0]
    const email = verificationToken.identifier

    // Update user email verification status
    await query(
      `UPDATE ${TABLE_NAMES.USERS} SET "emailVerified" = NOW() WHERE email = $1`,
      [email]
    )

    // Delete the used token
    await query(
      `DELETE FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE token = $1`,
      [token]
    )

    return { success: true, email }
  } catch (error) {
    logger.error('Email verification error', { error })
    return { success: false, error: 'Verifizierung fehlgeschlagen' }
  }
}

/**
 * Get verification token by email
 */
export async function getVerificationToken(email: string): Promise<DbVerificationToken | null> {
  const result = await query<DbVerificationToken>(
    `SELECT * FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE identifier = $1 AND expires > NOW() ORDER BY expires DESC LIMIT 1`,
    [email]
  )
  return result.rows[0] || null
}

/**
 * Create a 6-digit verification code for email verification
 * @param email - User's email address
 * @param expiresInMinutes - Code expiration time in minutes (default: 15)
 * @returns The generated 6-digit code
 */
export async function createVerificationCode(email: string, expiresInMinutes = 15): Promise<string> {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Set expiration
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  // Delete any existing codes for this email
  await query(
    `DELETE FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE identifier = $1`,
    [email.toLowerCase()]
  )

  // Insert new code
  await query(
    `INSERT INTO ${TABLE_NAMES.VERIFICATION_TOKENS} (identifier, token, expires)
     VALUES ($1, $2, $3)`,
    [email.toLowerCase(), code, expires]
  )

  return code
}

/**
 * Verify a 6-digit email verification code
 * @param email - User's email address
 * @param code - The 6-digit verification code
 * @returns Success status and email if verified
 */
export async function verifyEmailCode(email: string, code: string): Promise<{ success: boolean, error?: string }> {
  try {
    const result = await query<DbVerificationToken>(
      `SELECT * FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE identifier = $1 AND token = $2 AND expires > NOW()`,
      [email.toLowerCase(), code]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Code' }
    }

    // Update user email verification status
    const userColumns = await getUserColumns()
    const emailVerifiedColumn = userColumns.has('emailVerified') ? '"emailVerified"' : 'email_verified'

    await query(
      `UPDATE ${TABLE_NAMES.USERS} SET ${emailVerifiedColumn} = NOW() WHERE LOWER(email) = $1`,
      [email.toLowerCase()]
    )

    // Delete the used code
    await query(
      `DELETE FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE identifier = $1`,
      [email.toLowerCase()]
    )

    return { success: true }
  } catch (error) {
    logger.error('Email code verification error', { error })
    return { success: false, error: 'Verifizierung fehlgeschlagen' }
  }
}

// ============================================================================
// Password reset functions
// ============================================================================

export interface DbPasswordResetToken {
  identifier: string
  token: string
  expires: Date
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  // Generate a secure random token
  const token = randomBytes(32).toString('hex')

  // Set expiration to 1 hour from now
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await query(
    `INSERT INTO ${TABLE_NAMES.VERIFICATION_TOKENS} (identifier, token, expires)
     VALUES ($1, $2, $3)
     ON CONFLICT (identifier, token) DO UPDATE SET
       expires = EXCLUDED.expires`,
    [email.toLowerCase(), token, expires]
  )

  return token
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean, email?: string, error?: string }> {
  try {
    const result = await query<DbPasswordResetToken>(
      `SELECT * FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE token = $1 AND expires > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Token' }
    }

    const resetToken = result.rows[0]
    const email = resetToken.identifier

    // Delete the used token for security
    await query(
      `DELETE FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE token = $1`,
      [token]
    )

    return { success: true, email }
  } catch (error) {
    logger.error('Password reset token verification error', { error })
    return { success: false, error: 'Token-Verifizierung fehlgeschlagen' }
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(email: string, passwordHash: string): Promise<{ success: boolean, error?: string }> {
  try {
    const userColumns = await getUserColumns()
    const updatedAtColumn = userColumns.has('updatedAt') ? '"updatedAt"' : 'updated_at'
    const result = await query(
      `UPDATE ${TABLE_NAMES.USERS} SET password_hash = $1, ${updatedAtColumn} = NOW() WHERE email = $2`,
      [passwordHash, email.toLowerCase()]
    )

    if (result.rowCount === 0) {
      return { success: false, error: 'Benutzer nicht gefunden' }
    }

    return { success: true }
  } catch (error) {
    logger.error('Update password error', { error })
    return { success: false, error: 'Passwort konnte nicht aktualisiert werden' }
  }
}

/**
 * Get password reset token by email
 */
export async function getPasswordResetToken(email: string): Promise<DbPasswordResetToken | null> {
  const result = await query<DbPasswordResetToken>(
    `SELECT * FROM ${TABLE_NAMES.VERIFICATION_TOKENS} WHERE identifier = $1 AND expires > NOW() ORDER BY expires DESC LIMIT 1`,
    [email.toLowerCase()]
  )
  return result.rows[0] || null
}
