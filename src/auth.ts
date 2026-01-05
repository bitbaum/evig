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
import { getUserByEmail, createUser, getOrCreateProfile, createVerificationToken, type DbUser } from '@/lib/auth/db'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { sendEmail } from '@/lib/email'
import { ROLES, determineUserRole } from '@/lib/constants'
import { getMedusaConfig } from '@/lib/auth/config'
import { updateUser } from '@/lib/auth/db'

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
      console.error('Unexpected error on idle database pool:', err)
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
        console.log('Auth attempt with credentials:', {
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

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse')
          }

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
    // Add user id and role into JWT
    async jwt({ token, user }: { token: JWT & { id?: string; role?: string }, user?: User }) {
      // On first sign in, add user info to token
      if (user) {
        token.id = user.id
        // Use intelligent role determination based on email domain and other factors
        token.role = user.role || determineUserRole(user.email || '')
      }
      return token
    },

    // Expose id and role on the session
    async session({ session, token }: { session: Session, token: JWT & { id?: string; role?: string } }) {
      // Add user ID and role from JWT token to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },

    async signIn({ user }: { user: User }) {
      // Create profile on first sign in
      if (user.id) {
        try {
          await getOrCreateProfile(user.id)
        } catch (error) {
          console.error('Failed to create profile:', error)
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
  user?: {
    id: string
    email: string
    name: string | null
    emailVerified?: boolean
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

    // Create user
    try {
      const user = await createUser({
        email,
        name,
        password_hash,
        role,
      })

      // Create profile
      try {
        await getOrCreateProfile(user.id)
      } catch (profileError) {
        // Log but don't fail registration if profile creation fails
        console.error('Failed to create profile:', profileError)
      }

    // Optional: create Medusa customer and link ID
    try {
      const medusa = getMedusaConfig()
      if (medusa.adminApiKey && medusa.backendUrl) {
        const resp = await fetch(`${medusa.backendUrl}/admin/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Try both common admin auth headers, depending on Medusa setup
            'Authorization': `Bearer ${medusa.adminApiKey}`,
            'x-medusa-access-token': medusa.adminApiKey,
          },
          body: JSON.stringify({
            email,
            first_name: name || undefined,
          }),
        })
        if (resp.ok) {
          const data = await resp.json() as { customer?: { id?: string } }
          const medusaId = data?.customer?.id
          if (medusaId) {
            await updateUser(user.id, { medusa_customer_id: medusaId })
          }
        } else {
          console.warn('Medusa customer creation failed', resp.status)
        }
      }
    } catch (e) {
      console.warn('Medusa integration skipped/failed:', e)
    }

    // Create verification token
    const verificationToken = await createVerificationToken(email)

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`
    try {
      await sendEmail(email, 'emailVerification', name || 'RevampIT Benutzer', verificationUrl)
      console.log('Verification email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails, but log it
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false, // User needs to verify email
      },
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' }
  }
}
