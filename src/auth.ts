/**
 * RevampIT Unified Authentication Configuration
 *
 * Self-hosted Auth.js v5 with PostgreSQL adapter
 * Provides unified accounts for shop, workshops, services, and community
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'
import type { JWT } from 'next-auth/jwt'
import type { Session, User } from 'next-auth'
import { getUserByEmail, createUser, getOrCreateProfile, createVerificationCode, type DbUser } from '@/lib/auth/db'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { ROLES, determineUserRole } from '@/lib/constants'
import { getMedusaConfig } from '@/lib/auth/config'
import { updateUser } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

// Create PostgreSQL pool for Auth.js adapter with optimized connection settings
// Use lazy connection to avoid blocking page loads
let pool: Pool | null = null

function getAuthPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.AUTH_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.AUTH_DB_PORT || process.env.DB_PORT || '5433'),
      database: process.env.AUTH_DB_NAME || process.env.DB_NAME || 'revampit_cms',
      user: process.env.AUTH_DB_USER || process.env.DB_USER || 'postgres',
      password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000, // Reduced from 5000 to fail faster
      // Don't connect immediately - let it connect on first use
      allowExitOnIdle: true,
    })

    // Handle pool errors gracefully without crashing
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle database pool', { error: err })
      // Don't throw - let the app continue
    })
  }
  return pool
}

// Extend the built-in Auth.js types
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string
    emailVerified?: Date | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string
      emailVerified?: boolean
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
  
  // Skip adapter for now - JWT strategy works without it
  // Uncomment when OAuth providers are added:
  // adapter: PostgresAdapter(getAuthPool()),
  
  session: {
    // JWT strategy required for credentials provider
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
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
          throw new Error('E-Mail und Passwort sind erforderlich')
        }

        const email = creds.email as string
        const password = creds.password as string

        try {
          // Get user from database
          const user = await getUserByEmail(email)

          if (!user) {
            throw new Error('Kein Konto mit dieser E-Mail-Adresse gefunden')
          }

          if (!user.password_hash) {
            throw new Error('Dieses Konto verwendet eine andere Anmeldemethode')
          }

          // Verify password
          const isValid = await verifyPassword(password, user.password_hash)

          if (!isValid) {
            throw new Error('Falsches Passwort')
          }

          // Email verification not required for community app
          // Users can log in immediately after registration

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: user.emailVerified,
          }
        } catch (dbError) {
          // Handle database connection errors gracefully
          const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
          if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
            throw new Error('Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.')
          }
          // Re-throw other errors (like "user not found", "wrong password", etc.)
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
    // Add user id, role, and emailVerified into JWT
    async jwt({ token, user }: { token: JWT & { id?: string; role?: string; emailVerified?: boolean }, user?: User }) {
      // On first sign in, add user info to token
      if (user) {
        token.id = user.id
        // Use intelligent role determination based on email domain and other factors
        token.role = user.role || determineUserRole(user.email || '')
        token.emailVerified = !!user.emailVerified
      }
      return token
    },

    // Expose id, role, and emailVerified on the session
    async session({ session, token }: { session: Session, token: JWT & { id?: string; role?: string; emailVerified?: boolean } }) {
      // Add user ID, role, and emailVerified from JWT token to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified ?? false
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
  }
  error?: string
  errors?: string[]
}

export async function registerUser(data: {
  email: string
  password: string
  name?: string
  role?: string
}): Promise<RegisterResult> {
  const { email, password, name, role = ROLES.CUSTOMER } = data

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Ungültige E-Mail-Adresse' }
  }

  // Validate password strength
  const passwordCheck = validatePasswordStrength(password)
  if (!passwordCheck.isValid) {
    return { success: false, errors: passwordCheck.errors }
  }

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
      role,
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
    try {
      const verificationCode = await createVerificationCode(email)
      await sendEmail(email, 'verificationCode', name || 'Benutzer', verificationCode)
      logger.info('Verification code sent', { email, userId: user.id })
    } catch (emailError) {
      // Log but don't fail registration if email fails
      logger.error('Failed to send verification email', { error: emailError, userId: user.id })
    }

    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false, // User needs to verify via code
      },
    }
  } catch (error) {
    logger.error('Registration error', { error })
    return { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' }
  }
}
