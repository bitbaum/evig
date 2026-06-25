#!/usr/bin/env npx tsx
/**
 * Ops helper — unlock a stuck auth account.
 *
 * Usage:
 *   set -a && source .env.selfhost.local && set +a
 *   npx tsx scripts/dev/auth-unlock-user.ts user@example.com --verify-email
 *   AUTH_UNLOCK_PASSWORD='…' npx tsx scripts/dev/auth-unlock-user.ts user@example.com --set-password
 *
 * Never commit passwords. AUTH_UNLOCK_PASSWORD is read from the environment only.
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { getPasswordResetUrl } from '../../src/config/urls'

const email = process.argv[2]?.trim().toLowerCase()
const verifyEmail = process.argv.includes('--verify-email')
const setPassword = process.argv.includes('--set-password')
const printResetLink = process.argv.includes('--reset-link')

if (!email || !email.includes('@')) {
  console.error('Usage: npx tsx scripts/dev/auth-unlock-user.ts <email> [--verify-email] [--set-password] [--reset-link]')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const user = await pool.query(
    `SELECT id, email, name, "emailVerified", password_hash IS NOT NULL AS has_password FROM users WHERE lower(email) = lower($1)`,
    [email],
  )
  if (!user.rows[0]) {
    console.error('User not found:', email)
    process.exit(1)
  }

  const row = user.rows[0] as {
    id: string
    email: string
    name: string | null
    emailVerified: string | null
    has_password: boolean
  }

  console.log('Before:', {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    has_password: row.has_password,
  })

  if (verifyEmail) {
    await pool.query(`UPDATE users SET "emailVerified" = NOW(), "updatedAt" = NOW() WHERE id = $1`, [row.id])
    console.log('✓ emailVerified set to NOW()')
  }

  if (setPassword) {
    const plain = process.env.AUTH_UNLOCK_PASSWORD
    if (!plain) {
      console.error('AUTH_UNLOCK_PASSWORD env var required for --set-password')
      process.exit(1)
    }
    const hash = await bcrypt.hash(plain, 12)
    await pool.query(
      `UPDATE users SET password_hash = $1, "emailVerified" = COALESCE("emailVerified", NOW()), "updatedAt" = NOW() WHERE id = $2`,
      [hash, row.id],
    )
    console.log('✓ password_hash updated (emailVerified preserved or set)')
  }

  if (printResetLink) {
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await pool.query(`DELETE FROM verification_tokens WHERE identifier = $1`, [email])
    await pool.query(
      `INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1, $2, $3)`,
      [email, token, expires],
    )
    console.log('Reset link (1h):', getPasswordResetUrl(token))
  }

  const after = await pool.query(
    `SELECT "emailVerified", password_hash IS NOT NULL AS has_password FROM users WHERE id = $1`,
    [row.id],
  )
  console.log('After:', after.rows[0])
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => pool.end())
