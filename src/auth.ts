/**
 * RevampIT Unified Authentication Configuration
 *
 * Self-hosted Auth.js v5 with PostgreSQL adapter
 * Provides unified accounts for shop, workshops, services, and community
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'
import type { Session, User } from 'next-auth'
import { getUserByEmail, createUser, getOrCreateProfile, createVerificationCode, type DbUser } from '@/lib/auth/db'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { ROLES, isStaffEmail, getInitialStaffPermissions, isSuperAdmin } from '@/lib/constants'
import { recordFailedAttempt, isAccountLocked, recordFailedAttemptDb, clearLockoutDb } from '@/lib/auth/rate-limiter'
import { updateUser } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/config/security'
import { sendEmail } from '@/lib/email'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { DEFAULT_USER_NAME_FALLBACK } from '@/config/auth-ui'

// Database pool: uses the shared pool from @/lib/auth/db (single pool for the entire app)
// The Auth.js adapter is currently disabled (JWT strategy doesn't need it).
// When OAuth providers are added, use: adapter: PostgresAdapter(getPool())

// Extend the built-in Auth.js types
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string  // Legacy - kept for backward compatibility
    emailVerified?: Date | null
    // New simplified auth fields
    is_staff?: boolean
    staff_permissions?: string[]
    is_super_admin?: boolean
    dashboard_mode?: 'coordinator' | 'lead' | 'volunteer'
    // JWT staleness counter — see jwt callback for usage
    token_version?: number
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string  // Legacy - kept for backward compatibility
      emailVerified?: boolean
      // New simplified auth fields
      isStaff: boolean
      staffPermissions: string[]
      isSuperAdmin: boolean
      dashboardMode: 'coordinator' | 'lead' | 'volunteer'
    }
  }
}

// Note: For Auth.js v5 the JWT type is already defined internally.

// Main Auth.js configuration (v5)
// Note: For JWT strategy with credentials provider, adapter is optional
// JWT sessions are stored in cookies, not database, so adapter is only needed for OAuth
// For now, we skip the adapter to avoid blocking on database connection issues
// The adapter can be added later when OAuth providers are needed
export const authConfig = {
  // Secret for signing cookies and tokens
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Required for Auth.js v5 on non-localhost deployments (Vercel, etc.)
  trustHost: true,

  // Skip adapter for now - JWT strategy works without it
  // Uncomment when OAuth providers are added:
  // adapter: PostgresAdapter(getPool()),  // import { getPool } from '@/lib/auth/db'

  session: {
    // JWT strategy required for credentials provider
    strategy: 'jwt' as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/login',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard/profile', // Redirect new users to complete profile
  },

  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email & Passwort',
      credentials: {
        email: {
          label: 'E-Mail',
          type: 'email',
          placeholder: 'name@beispiel.ch',
        },
        password: {
          label: 'Passwort',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const creds = credentials as { email?: string; password?: string } | null
        logger.debug('Auth attempt with credentials', {
          hasEmail: !!creds?.email,
          hasPassword: !!creds?.password,
          email: creds?.email,
          passwordLength: (creds?.password ?? '').length,
        })

        if (!creds?.email || !creds?.password) {
          throw new Error(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED)
        }

        const email = creds.email as string
        const password = creds.password as string

        try {
          // Get user from database
          const user = await getUserByEmail(email)

          // Generic error message to prevent user enumeration
          const invalidCredentialsError = 'Ungültige E-Mail-Adresse oder Passwort'

          if (!user) {
            throw new Error(invalidCredentialsError)
          }

          // SECURITY: Check account lockout before password validation
          const lockoutCheck = isAccountLocked(`${user.id}:login`)
          if (lockoutCheck.locked) {
            const minutes = Math.ceil((lockoutCheck.retryAfter ?? 60) / 60)
            throw new Error(`Konto vorübergehend gesperrt. Versuche es in ${minutes} Minuten erneut.`)
          }

          if (!user.password_hash) {
            throw new Error('Dieses Konto verwendet eine andere Anmeldemethode')
          }

          // Verify password
          const isValid = await verifyPassword(password, user.password_hash)

          if (!isValid) {
            // Record failed attempt for lockout tracking (in-memory + DB)
            recordFailedAttempt(`${user.id}:login`)
            recordFailedAttemptDb(user.id, 'login').catch(err =>
              logger.error('Failed to record lockout attempt in DB', { error: err, userId: user.id })
            )
            throw new Error(invalidCredentialsError)
          }

          // SECURITY: Clear lockout on successful login
          clearLockoutDb(user.id).catch(err =>
            logger.error('Failed to clear lockout in DB', { error: err, userId: user.id })
          )

          // SECURITY: Require email verification before login
          if (!user.emailVerified) {
            throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse. Überprüfe deinen Posteingang.')
          }

          // Determine staff status — DB flag is SSOT, email domain only for initial setup
          const userIsStaff = Boolean(user.is_staff) || isStaffEmail(user.email)
          const userPermissions = user.staff_permissions?.length
            ? user.staff_permissions
            : (userIsStaff ? getInitialStaffPermissions(user.email) : [])
          const userIsSuperAdmin = Boolean(user.is_super_admin) || isSuperAdmin(user.email)

          // Return user object with new simplified auth fields
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,  // Legacy
            emailVerified: user.emailVerified,
            // New simplified auth fields
            is_staff: userIsStaff,
            staff_permissions: userPermissions,
            is_super_admin: userIsSuperAdmin,
            dashboard_mode: user.dashboard_mode ?? 'coordinator',
          }
        } catch (dbError) {
          // Handle database connection errors gracefully
          const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)

          if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
            logger.error('AUTH_DB_UNAVAILABLE', {
              email,
              provider: 'credentials',
              reason: errorMessage,
            })
            throw new Error(ERROR_MESSAGES.DB_CONNECTION_FAILED)
          }

          logger.warn('AUTH_LOGIN_REJECTED', {
            email,
            provider: 'credentials',
            reason: errorMessage,
          })

          // Re-throw other errors (like invalid credentials)
          throw dbError
        }
      },
    }),
    // Future: Add magic link provider
    // Email({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
  ],

  callbacks: {
    // Populate JWT token from user data. Two paths:
    //   1. Initial sign-in (`user` is defined): capture all permission
    //      claims plus the user's current token_version from the DB row.
    //   2. Subsequent refreshes (`user` is undefined): re-fetch the
    //      user's token_version from the DB and compare against the
    //      token's. If they diverge, an admin has changed permissions
    //      since the token was minted — re-fetch the full user and
    //      refresh the permission claims. This is the stale-permissions
    //      enforcement (3/3 of the JWT-stale-permissions sequence).
    //
    // Without #2, a demoted admin retained their old is_staff/
    // staff_permissions/is_super_admin claims for up to 30 days
    // (Auth.js maxAge) until they manually re-logged-in. With #2, the
    // demotion takes effect on the next token refresh — at most 24h
    // (Auth.js updateAge), often immediately on the next request.
    //
    // Perf: the DB lookup is a single PK-indexed SELECT, gated to
    // refresh-time only (~once per 24h per active user). Failures fall
    // through to the token's existing claims so transient DB issues
    // don't break auth.
    async jwt({ token, user }: {
      token: JWT & {
        id?: string
        role?: string
        emailVerified?: boolean
        isStaff?: boolean
        staffPermissions?: string[]
        isSuperAdmin?: boolean
        dashboardMode?: 'coordinator' | 'lead' | 'volunteer'
        tokenVersion?: number
      },
      user?: User
    }) {
      // Path 1: initial sign-in
      if (user) {
        token.id = user.id
        // Legacy role - kept for backward compatibility
        // Staff get REVAMPIT_ADMIN, others get CUSTOMER
        // SECURITY: Only grant staff privileges if email is verified
        const emailVerified = !!user.emailVerified
        const userIsStaff = emailVerified ? (Boolean(user.is_staff) || isStaffEmail(user.email ?? '')) : false
        token.role = user.role || (userIsStaff ? ROLES.REVAMPIT_ADMIN : ROLES.CUSTOMER)
        token.emailVerified = emailVerified
        // New simplified auth fields
        token.isStaff = userIsStaff
        token.staffPermissions = user.staff_permissions?.length
          ? user.staff_permissions
          : (userIsStaff ? getInitialStaffPermissions(user.email ?? '') : [])
        token.isSuperAdmin = emailVerified ? (Boolean(user.is_super_admin) || isSuperAdmin(user.email ?? '')) : false
        token.dashboardMode = user.dashboard_mode ?? 'coordinator'
        token.tokenVersion = user.token_version ?? 0
        return token
      }

      // Path 2: token refresh (no user arg). Detect stale permissions.
      if (token.id) {
        try {
          const { getUserById } = await import('@/lib/auth/db')
          const freshUser = await getUserById(token.id as string)
          if (freshUser && freshUser.token_version !== (token.tokenVersion ?? 0)) {
            // Admin changed permissions — refresh the token's claims.
            const emailVerified = !!freshUser.emailVerified
            const userIsStaff = emailVerified
              ? (Boolean(freshUser.is_staff) || isStaffEmail(freshUser.email ?? ''))
              : false
            token.role = freshUser.role || (userIsStaff ? ROLES.REVAMPIT_ADMIN : ROLES.CUSTOMER)
            token.emailVerified = emailVerified
            token.isStaff = userIsStaff
            token.staffPermissions = freshUser.staff_permissions?.length
              ? freshUser.staff_permissions
              : (userIsStaff ? getInitialStaffPermissions(freshUser.email ?? '') : [])
            token.isSuperAdmin = emailVerified
              ? (Boolean(freshUser.is_super_admin) || isSuperAdmin(freshUser.email ?? ''))
              : false
            token.dashboardMode = freshUser.dashboard_mode ?? 'coordinator'
            token.tokenVersion = freshUser.token_version
            logger.info('JWT permissions refreshed after admin change', {
              userId: token.id,
              newTokenVersion: freshUser.token_version,
            })
          }
        } catch (error) {
          // Defensive: transient DB failure shouldn't break auth. Token
          // keeps its existing claims; next refresh re-attempts the check.
          logger.warn('JWT staleness check failed — keeping existing token', {
            userId: token.id,
            error,
          })
        }
      }
      return token
    },

    // Expose user info on the session
    async session({ session, token }: {
      session: Session,
      token: JWT & {
        id?: string
        role?: string
        emailVerified?: boolean
        isStaff?: boolean
        staffPermissions?: string[]
        isSuperAdmin?: boolean
        dashboardMode?: 'coordinator' | 'lead' | 'volunteer'
      }
    }) {
      // Add all user info from JWT token to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string  // Legacy
        session.user.emailVerified = token.emailVerified ?? false
        // New simplified auth fields
        session.user.isStaff = token.isStaff ?? false
        session.user.staffPermissions = token.staffPermissions ?? []
        session.user.isSuperAdmin = token.isSuperAdmin ?? false
        session.user.dashboardMode = token.dashboardMode ?? 'coordinator'
      }
      return session
    },

    async signIn({ user }: { user: User }) {
      // Create profile on first sign in
      if (user.id) {
        try {
          await getOrCreateProfile(user.id)
        } catch (error) {
          logger.error('Failed to create profile', { error, userId: user.id })
        }
      }
      return true
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
}

// Export Auth.js helpers for App Router
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// ============================================================================
// Registration helper (not part of Auth.js, but used by registration API)
// ============================================================================

export interface RegisterResult {
  success: boolean
  data?: {
    userId: string
    email: string
    name: string | null
    emailVerified: boolean
    emailSent: boolean
  }
  error?: string
  errors?: string[]
}

export async function registerUser(data: {
  email: string
  password: string
  name?: string
}): Promise<RegisterResult> {
  const { email, password, name } = data

  // Determine staff status from email domain
  const is_staff = isStaffEmail(email)
  const staff_permissions = is_staff ? getInitialStaffPermissions(email) : []

  // Legacy role column — still written so pre-permissions-v2 code paths
  // (admin queries, audit logs) keep working. New code reads is_staff
  // + staff_permissions instead. Per permissions-v2 migration plan, the
  // role column will be dropped once the last legacy reader is gone.
  const role = is_staff ? ROLES.REVAMPIT_ADMIN : ROLES.CUSTOMER

  // Email + password format are already validated by RegisterSchema at
  // the API boundary (lib/schemas/auth.ts, derived from AUTH_CONFIG).
  // No need to re-validate here — the Zod parse rejects bad input before
  // we ever reach this function.

  // Check if user already exists
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { success: false, error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits' }
  }

  // Hash password
  const password_hash = await hashPassword(password)

  // Create user WITHOUT email verification (user must verify via 6-digit code)
  try {
    const user = await createUser({
      email,
      name,
      password_hash,
      role,  // Legacy
      // New simplified auth fields
      is_staff,
      staff_permissions,
      // emailVerified: false by default - user must verify
    })

    // Create profile
    try {
      await getOrCreateProfile(user.id)
    } catch (profileError) {
      // Log but don't fail registration if profile creation fails
      logger.error('Failed to create profile', { error: profileError, userId: user.id })
    }

    // Generate 6-digit verification code and send email
    // Staff members get a different template with team-focused messaging
    let emailSent = false
    try {
      const verificationCode = await createVerificationCode(email)
      const templateName = is_staff ? 'staffVerificationCode' : 'verificationCode'
      const emailResult = await sendEmail(email, templateName, name || DEFAULT_USER_NAME_FALLBACK, verificationCode)
      if (!emailResult.success) {
        logger.error('Email send returned failure', { error: emailResult.error, email, userId: user.id })
      } else {
        emailSent = true
        logger.info('Verification code sent', { email, userId: user.id, isStaff: is_staff })
      }
    } catch (emailError) {
      logger.error('Failed to send verification email', { error: emailError, userId: user.id })
    }

    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false, // User needs to verify via code
        emailSent,
      },
    }
  } catch (error) {
    logger.error('Registration error', { error })
    return { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuche es später erneut.' }
  }
}
