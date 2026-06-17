/**
 * DEV ONLY — mint a valid next-auth session cookie for an existing user so an
 * automated agent can test authenticated pages without typing a password.
 * Uses the app's own AUTH_SECRET (from .env.local) + the same claim shape the
 * jwt callback produces. Prints `name=value` for the session cookie.
 *
 * Usage: npx tsx scripts/dev-mint-session.ts <email>
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { encode } from '@auth/core/jwt'
import { getUserByEmail } from '@/lib/auth/db'
import { ROLES, isStaffEmail, getInitialStaffPermissions, isSuperAdmin } from '@/lib/constants'

async function main() {
  const email = process.argv[2]
  if (!email) throw new Error('usage: dev-mint-session.ts <email>')

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET not set in env')

  const user = await getUserByEmail(email)
  if (!user) throw new Error(`no user for ${email}`)

  const emailVerified = !!user.emailVerified
  const userIsStaff = emailVerified ? (Boolean(user.is_staff) || isStaffEmail(user.email)) : false
  const token = {
    sub: user.id,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || (userIsStaff ? ROLES.REVAMPIT_ADMIN : ROLES.CUSTOMER),
    emailVerified,
    isStaff: userIsStaff,
    staffPermissions: user.staff_permissions?.length
      ? user.staff_permissions
      : (userIsStaff ? getInitialStaffPermissions(user.email) : []),
    isSuperAdmin: emailVerified ? (Boolean(user.is_super_admin) || isSuperAdmin(user.email)) : false,
    dashboardMode: user.dashboard_mode ?? 'coordinator',
    tokenVersion: user.token_version ?? 0,
  }

  // http localhost → cookie name (and JWE salt) is "authjs.session-token"
  const salt = 'authjs.session-token'
  const maxAge = 30 * 24 * 60 * 60
  const value = await encode({ token, secret, salt, maxAge })
  process.stdout.write(`${salt}\t${value}\n`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
