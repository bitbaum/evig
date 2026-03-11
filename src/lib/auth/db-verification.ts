/**
 * Email verification and password reset database queries
 */

import { randomBytes } from 'crypto'
import { eq, and, gt, sql, desc } from 'drizzle-orm'
import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema/auth'
import { logger } from '@/lib/logger'

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

  await db
    .insert(verificationTokens)
    .values({
      identifier: email,
      token,
      expires: expires.toISOString(),
    })
    .onConflictDoUpdate({
      target: [verificationTokens.identifier, verificationTokens.token],
      set: { expires: expires.toISOString() },
    })

  return token
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string): Promise<{ success: boolean, email?: string, error?: string }> {
  try {
    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, sql`NOW()`)
        )
      )

    if (rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Token' }
    }

    const verificationToken = rows[0]
    const email = verificationToken.identifier

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: sql`NOW()`.mapWith(String) })
      .where(eq(users.email, email))

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

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
  const rows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        gt(verificationTokens.expires, sql`NOW()`)
      )
    )
    .orderBy(desc(verificationTokens.expires))
    .limit(1)

  if (rows.length === 0) return null

  const row = rows[0]
  return { identifier: row.identifier, token: row.token, expires: new Date(row.expires) }
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

  const lowerEmail = email.toLowerCase()

  // Delete any existing codes for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, lowerEmail))

  // Insert new code
  await db
    .insert(verificationTokens)
    .values({
      identifier: lowerEmail,
      token: code,
      expires: expires.toISOString(),
    })

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
    const lowerEmail = email.toLowerCase()

    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, lowerEmail),
          eq(verificationTokens.token, code),
          gt(verificationTokens.expires, sql`NOW()`)
        )
      )

    if (rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Code' }
    }

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: sql`NOW()`.mapWith(String) })
      .where(eq(users.email, lowerEmail))

    // Delete the used code
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, lowerEmail))

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

  await db
    .insert(verificationTokens)
    .values({
      identifier: email.toLowerCase(),
      token,
      expires: expires.toISOString(),
    })
    .onConflictDoUpdate({
      target: [verificationTokens.identifier, verificationTokens.token],
      set: { expires: expires.toISOString() },
    })

  return token
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean, email?: string, error?: string }> {
  try {
    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, sql`NOW()`)
        )
      )

    if (rows.length === 0) {
      return { success: false, error: 'Ungültiger oder abgelaufener Token' }
    }

    const resetToken = rows[0]
    const email = resetToken.identifier

    // Delete the used token for security
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

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
    const result = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: sql`NOW()`.mapWith(String),
      })
      .where(eq(users.email, email.toLowerCase()))
      .returning({ id: users.id })

    if (result.length === 0) {
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
  const rows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email.toLowerCase()),
        gt(verificationTokens.expires, sql`NOW()`)
      )
    )
    .orderBy(desc(verificationTokens.expires))
    .limit(1)

  if (rows.length === 0) return null

  const row = rows[0]
  return { identifier: row.identifier, token: row.token, expires: new Date(row.expires) }
}
