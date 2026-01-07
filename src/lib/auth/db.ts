/**
 * Database client for RevampIT unified auth
 * Uses the pg package for PostgreSQL connection
 * 
 * SSOT Compliance: All table names must use TABLE_NAMES from config
 */

import { randomBytes } from 'crypto'
import { Pool, PoolClient } from 'pg'
import { logger } from '@/lib/logger'
import { getDbConfig } from './config'
import { TABLE_NAMES } from '@/config/database'
import type { QueryParams, SocialLinks, Availability, PurchaseHistoryItem, PreferenceValue, SegmentCriteria } from '@/types/common'

// Get database configuration from centralized config
const dbConfig = {
  ...getDbConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}

// Create connection pool (singleton)
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)
    
    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on auth database pool', { error: err })
    })
  }
  return pool
}

/**
 * Execute a query with automatic connection management
 * Handles database connection errors gracefully
 */
export async function query<T = unknown>(
  text: string,
  params?: QueryParams
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const pool = getPool()
    const result = await pool.query(text, params)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    // Check for connection errors
    if (errorMessage.includes('connect') || 
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('Connection closed')) {
      logger.error('Database connection error', { error, query: text.substring(0, 100) })
      throw new Error('Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.')
    }
    // Re-throw other database errors (constraint violations, etc.)
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return pool.connect()
}

// Cache user columns to keep queries schema-safe across migrations
let userColumnsCache: Set<string> | null = null

async function getUserColumns(): Promise<Set<string>> {
  if (userColumnsCache) {
    return userColumnsCache
  }

  const result = await query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`
  )

  userColumnsCache = new Set(result.rows.map((row) => row.column_name))
  return userColumnsCache
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ============================================================================
// User queries
// ============================================================================

export interface DbUser {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null  // camelCase for Auth.js
  password_hash: string | null
  image: string | null
  role: string
  status: string
  role_id: string | null
  medusa_customer_id: string | null
  account_type: string
  last_activity_at: Date | null
  createdAt: Date  // camelCase for Auth.js
  updatedAt: Date  // camelCase for Auth.js
}

export interface DbUserProfile {
  user_id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  phone: string | null
  mobile: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  canton: string | null
  country: string
  interests: string[] | null
  preferred_language: string
  newsletter_subscribed: boolean
  is_supporter: boolean
  supporter_type: string | null
  date_of_birth: Date | null
  gender: string | null
  occupation: string | null
  bio: string | null
  website: string | null
  social_links: SocialLinks | null
  skills: string[] | null
  expertise_areas: string[] | null
  availability: Availability | null
  customer_segment: string | null
  purchase_history: PurchaseHistoryItem[] | null
  loyalty_points: number | null
  created_at: Date
  updated_at: Date
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await query<DbUser>(
    `SELECT * FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [email.toLowerCase()]
  )
  return result.rows[0] || null
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<DbUser | null> {
  const result = await query<DbUser>(
    `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  name?: string
  password_hash?: string
  image?: string
  role?: string
  status?: string
  account_type?: string
  medusa_customer_id?: string
}): Promise<DbUser> {
  const userColumns = await getUserColumns()

  // Get default role if not specified
  let roleId = null
  if (userColumns.has('role_id')) {
    if (data.role) {
      const roleResult = await query<DbUserRole>(
        `SELECT id FROM ${TABLE_NAMES.USER_ROLES} WHERE slug = $1 AND is_active = true`,
        [data.role]
      )
      roleId = roleResult.rows[0]?.id || null
    } else {
      // Get default role
      const defaultRoleResult = await query<DbUserRole>(
        `SELECT id FROM ${TABLE_NAMES.USER_ROLES} WHERE is_default = true AND is_active = true LIMIT 1`
      )
      roleId = defaultRoleResult.rows[0]?.id || null
    }
  }

  const columns: string[] = ['email', 'name', 'password_hash', 'image', 'role']
  const values: QueryParams = [
    data.email.toLowerCase(),
    data.name || null,
    data.password_hash || null,
    data.image || null,
    data.role || 'user'
  ]

  // Set email as verified by default (no verification step required)
  if (userColumns.has('emailVerified')) {
    columns.push('"emailVerified"')
    values.push(new Date())
  } else if (userColumns.has('email_verified')) {
    columns.push('email_verified')
    values.push(new Date())
  }

  if (userColumns.has('status')) {
    columns.push('status')
    values.push(data.status || 'active')
  }

  if (userColumns.has('account_type')) {
    columns.push('account_type')
    values.push(data.account_type || 'individual')
  }

  if (userColumns.has('medusa_customer_id')) {
    columns.push('medusa_customer_id')
    values.push(data.medusa_customer_id || null)
  }

  if (userColumns.has('role_id')) {
    columns.push('role_id')
    values.push(roleId)
  }

  const placeholders = columns.map((_, idx) => `$${idx + 1}`)

  const result = await query<DbUser>(
    `INSERT INTO ${TABLE_NAMES.USERS} (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    values
  )
  return result.rows[0]
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<DbUser, 'name' | 'email' | 'emailVerified' | 'password_hash' | 'image' | 'role' | 'status' | 'account_type' | 'medusa_customer_id'>>
): Promise<DbUser | null> {
  const userColumns = await getUserColumns()
  const fields: string[] = []
  const values: QueryParams = []
  let paramIndex = 1

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramIndex++}`)
    values.push(data.email.toLowerCase())
  }
  if (data.emailVerified !== undefined) {
    const emailVerifiedColumn = userColumns.has('emailVerified') ? '"emailVerified"' : 'email_verified'
    fields.push(`${emailVerifiedColumn} = $${paramIndex++}`)
    values.push(data.emailVerified)
  }
  if (data.password_hash !== undefined && userColumns.has('password_hash')) {
    fields.push(`password_hash = $${paramIndex++}`)
    values.push(data.password_hash)
  }
  if (data.image !== undefined && userColumns.has('image')) {
    fields.push(`image = $${paramIndex++}`)
    values.push(data.image)
  }
  if (data.role !== undefined && userColumns.has('role')) {
    fields.push(`role = $${paramIndex++}`)
    values.push(data.role)

    // Also update role_id if role is being changed
    if (userColumns.has('role_id')) {
      const roleResult = await query<DbUserRole>(
        `SELECT id FROM ${TABLE_NAMES.USER_ROLES} WHERE slug = $1 AND is_active = true`,
        [data.role]
      )
      fields.push(`role_id = $${paramIndex++}`)
      values.push(roleResult.rows[0]?.id || null)
    }
  }
  if (data.status !== undefined && userColumns.has('status')) {
    fields.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }
  if (data.account_type !== undefined && userColumns.has('account_type')) {
    fields.push(`account_type = $${paramIndex++}`)
    values.push(data.account_type)
  }
  if (data.medusa_customer_id !== undefined && userColumns.has('medusa_customer_id')) {
    fields.push(`medusa_customer_id = $${paramIndex++}`)
    values.push(data.medusa_customer_id)
  }

  if (fields.length === 0) return getUserById(id)

  values.push(id)
  const updatedAtColumn = userColumns.has('updatedAt') ? '"updatedAt"' : 'updated_at'
  const updateSet = `${fields.join(', ')}${fields.length ? ', ' : ''}${updatedAtColumn} = NOW()`
  const result = await query<DbUser>(
    `UPDATE ${TABLE_NAMES.USERS} SET ${updateSet} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result.rows[0] || null
}

/**
 * Get or create user profile
 */
export async function getOrCreateProfile(userId: string): Promise<DbUserProfile> {
  // Try to get existing profile
  const existing = await query<DbUserProfile>(
    `SELECT * FROM ${TABLE_NAMES.USER_PROFILES} WHERE user_id = $1`,
    [userId]
  )
  
  if (existing.rows[0]) {
    return existing.rows[0]
  }

  // Create new profile
  const result = await query<DbUserProfile>(
    `INSERT INTO ${TABLE_NAMES.USER_PROFILES} (user_id) VALUES ($1) RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: Partial<Omit<DbUserProfile, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DbUserProfile | null> {
  const fields: string[] = []
  const values: QueryParams = []
  let paramIndex = 1

  const fieldMap: Record<string, keyof typeof data> = {
    first_name: 'first_name',
    last_name: 'last_name',
    company_name: 'company_name',
    phone: 'phone',
    mobile: 'mobile',
    address_line1: 'address_line1',
    address_line2: 'address_line2',
    postal_code: 'postal_code',
    city: 'city',
    canton: 'canton',
    country: 'country',
    interests: 'interests',
    preferred_language: 'preferred_language',
    newsletter_subscribed: 'newsletter_subscribed',
    is_supporter: 'is_supporter',
    supporter_type: 'supporter_type',
    date_of_birth: 'date_of_birth',
    gender: 'gender',
    occupation: 'occupation',
    bio: 'bio',
    website: 'website',
    social_links: 'social_links',
    skills: 'skills',
    expertise_areas: 'expertise_areas',
    availability: 'availability',
    customer_segment: 'customer_segment',
    purchase_history: 'purchase_history',
    loyalty_points: 'loyalty_points',
  }

  for (const [dbField, dataField] of Object.entries(fieldMap)) {
    if (data[dataField] !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`)
      values.push(data[dataField])
    }
  }

  if (fields.length === 0) return getOrCreateProfile(userId)

  values.push(userId)
  const result = await query<DbUserProfile>(
    `UPDATE ${TABLE_NAMES.USER_PROFILES} SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING *`,
    values
  )
  return result.rows[0] || null
}

// ============================================================================
// Workshop queries
// ============================================================================

export interface DbWorkshop {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  duration: string | null
  level: string | null
  max_participants: number | null
  price_cents: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbWorkshopRegistration {
  id: string
  user_id: string
  workshop_instance_id: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  payment_reference: string | null
  attended: boolean
  rating: number | null
  feedback: string | null
  notes: string | null
  confirmed_at: Date | null
  cancelled_at: Date | null
  created_at: Date
  updated_at: Date
}

/**
 * Get workshop by slug
 */
export async function getWorkshopBySlug(slug: string): Promise<DbWorkshop | null> {
  const result = await query<DbWorkshop>(
    `SELECT * FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get workshops for user (registered or not)
 */
export async function getWorkshopsForUser(userId: string): Promise<Array<DbWorkshop & { registration_status?: string }>> {
  const result = await query<DbWorkshop & { registration_status?: string }>(
    `SELECT
       w.*,
       wr.status as registration_status
     FROM ${TABLE_NAMES.WORKSHOPS} w
     LEFT JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON w.id = wi.workshop_id
     LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id AND wr.user_id = $1
     WHERE w.is_active = true
     ORDER BY w.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Get user's workshop registrations
 */
export async function getUserWorkshopRegistrations(userId: string): Promise<Array<DbWorkshopRegistration & { workshop_title: string, workshop_slug: string }>> {
  const result = await query<DbWorkshopRegistration & { workshop_title: string, workshop_slug: string }>(
    `SELECT
       wr.*,
       w.title as workshop_title,
       w.slug as workshop_slug
     FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
     JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
     JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
     WHERE wr.user_id = $1
     ORDER BY wr.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Check if user is registered for a workshop
 */
export async function isUserRegisteredForWorkshop(userId: string, workshopSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
     JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
     JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
     WHERE wr.user_id = $1 AND w.slug = $2 AND wr.status != 'cancelled'`,
    [userId, workshopSlug]
  )
  return result.rows.length > 0
}

// ============================================================================
// Service appointment queries
// ============================================================================

export interface DbServiceAppointment {
  id: string
  user_id: string
  service_type_id: string
  preferred_date: Date | null
  confirmed_date: Date | null
  description: string | null
  device_info: string | null
  urgency: string
  status: string
  outcome_notes: string | null
  price_charged_cents: number | null
  created_at: Date
  updated_at: Date
}

export interface DbServiceType {
  id: string
  slug: string
  name: string
  description: string | null
  duration_minutes: number
  price_cents: number | null
  requires_approval: boolean
  is_active: boolean
  created_at: Date
}

/**
 * Get service type by slug
 */
export async function getServiceTypeBySlug(slug: string): Promise<DbServiceType | null> {
  const result = await query<DbServiceType>(
    `SELECT * FROM ${TABLE_NAMES.SERVICE_TYPES} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get user's service appointments
 */
export async function getUserServiceAppointments(userId: string): Promise<Array<DbServiceAppointment & { service_name: string, service_slug: string }>> {
  const result = await query<DbServiceAppointment & { service_name: string, service_slug: string }>(
    `SELECT
       sa.*,
       st.name as service_name,
       st.slug as service_slug
     FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
     JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
     WHERE sa.user_id = $1
     ORDER BY sa.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Check if user has pending appointment for service
 */
export async function hasPendingAppointmentForService(userId: string, serviceSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
     JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
     WHERE sa.user_id = $1 AND st.slug = $2 AND sa.status IN ('requested', 'confirmed')`,
    [userId, serviceSlug]
  )
  return result.rows.length > 0
}

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

// ============================================================================
// Password reset functions
// ============================================================================

export interface DbPasswordResetToken {
  identifier: string
  token: string
  expires: Date
}

// ============================================================================
// NEW SCHEMA INTERFACES
// ============================================================================

export interface DbUserRole {
  id: string
  slug: string
  name: string
  description: string | null
  is_active: boolean
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export interface DbPermission {
  id: string
  slug: string
  name: string
  description: string | null
  resource: string
  action: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbRolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: Date
}

export interface DbCustomerPreference {
  id: string
  user_id: string
  preference_key: string
  preference_value: PreferenceValue
  created_at: Date
  updated_at: Date
}

export interface DbCustomerSegment {
  id: string
  slug: string
  name: string
  description: string | null
  criteria: SegmentCriteria
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface DbUserSegment {
  id: string
  user_id: string
  segment_id: string
  assigned_at: Date
  assigned_by: string | null
  notes: string | null
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

// ============================================================================
// NEW SCHEMA QUERY FUNCTIONS
// ============================================================================

/**
 * Get user role by ID
 */
export async function getUserRoleById(id: string): Promise<DbUserRole | null> {
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

/**
 * Get user role by slug
 */
export async function getUserRoleBySlug(slug: string): Promise<DbUserRole | null> {
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0] || null
}

/**
 * Get all active user roles
 */
export async function getActiveUserRoles(): Promise<DbUserRole[]> {
  const result = await query<DbUserRole>(
    `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE is_active = true ORDER BY name`
  )
  return result.rows
}

/**
 * Get permissions for a user role
 */
export async function getRolePermissions(roleId: string): Promise<DbPermission[]> {
  const result = await query<DbPermission>(
    `SELECT p.* FROM ${TABLE_NAMES.PERMISSIONS} p
     JOIN ${TABLE_NAMES.ROLE_PERMISSIONS} rp ON p.id = rp.permission_id
     WHERE rp.role_id = $1 AND p.is_active = true
     ORDER BY p.resource, p.action`,
    [roleId]
  )
  return result.rows
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(userId: string, permissionSlug: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM ${TABLE_NAMES.ROLE_PERMISSIONS} rp
     JOIN ${TABLE_NAMES.PERMISSIONS} p ON rp.permission_id = p.id
     JOIN ${TABLE_NAMES.USERS} u ON u.role_id = rp.role_id
     WHERE u.id = $1 AND p.slug = $2 AND p.is_active = true`,
    [userId, permissionSlug]
  )
  return result.rows.length > 0
}

/**
 * Get user customer preferences
 */
export async function getUserPreferences(userId: string): Promise<DbCustomerPreference[]> {
  const result = await query<DbCustomerPreference>(
    `SELECT * FROM ${TABLE_NAMES.CUSTOMER_PREFERENCES} WHERE user_id = $1 ORDER BY preference_key`,
    [userId]
  )
  return result.rows
}

/**
 * Set user customer preference
 */
export async function setUserPreference(
  userId: string,
  key: string,
  value: PreferenceValue
): Promise<DbCustomerPreference> {
  const result = await query<DbCustomerPreference>(
    `INSERT INTO ${TABLE_NAMES.CUSTOMER_PREFERENCES} (user_id, preference_key, preference_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, preference_key)
     DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = NOW()
     RETURNING *`,
    [userId, key, JSON.stringify(value)]
  )
  return result.rows[0]
}

/**
 * Get user's customer segments
 */
export async function getUserSegments(userId: string): Promise<Array<DbUserSegment & { segment: DbCustomerSegment }>> {
  const result = await query<DbUserSegment & { segment: DbCustomerSegment }>(
    `SELECT us.*, cs.slug, cs.name, cs.description, cs.criteria
     FROM ${TABLE_NAMES.USER_SEGMENTS} us
     JOIN ${TABLE_NAMES.CUSTOMER_SEGMENTS} cs ON us.segment_id = cs.id
     WHERE us.user_id = $1 AND cs.is_active = true
     ORDER BY us.assigned_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Add user to customer segment
 */
export async function addUserToSegment(
  userId: string,
  segmentSlug: string,
  assignedBy?: string,
  notes?: string
): Promise<DbUserSegment | null> {
  const segmentResult = await query<DbCustomerSegment>(
    `SELECT id FROM ${TABLE_NAMES.CUSTOMER_SEGMENTS} WHERE slug = $1 AND is_active = true`,
    [segmentSlug]
  )

  if (segmentResult.rows.length === 0) {
    return null
  }

  const segmentId = segmentResult.rows[0].id

  const result = await query<DbUserSegment>(
    `INSERT INTO ${TABLE_NAMES.USER_SEGMENTS} (user_id, segment_id, assigned_by, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, segment_id) DO NOTHING
     RETURNING *`,
    [userId, segmentId, assignedBy || null, notes || null]
  )

  return result.rows[0] || null
}

/**
 * Update user's last activity timestamp
 */
export async function updateUserLastActivity(userId: string): Promise<void> {
  await query(
    `UPDATE ${TABLE_NAMES.USERS} SET last_activity_at = NOW() WHERE id = $1`,
    [userId]
  )
}

/**
 * Get user with full profile and role information
 */
export async function getUserWithProfile(userId: string): Promise<DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } | null> {
  const userResult = await query<DbUser>(
    `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
    [userId]
  )

  if (userResult.rows.length === 0) {
    return null
  }

  const user = userResult.rows[0]
  const result: DbUser & { profile?: DbUserProfile, role_info?: DbUserRole, permissions?: DbPermission[] } = { ...user }

  // Get profile
  const profileResult = await query<DbUserProfile>(
    `SELECT * FROM ${TABLE_NAMES.USER_PROFILES} WHERE user_id = $1`,
    [userId]
  )
  result.profile = profileResult.rows[0] || undefined

  // Get role info
  if (user.role_id) {
    const roleResult = await query<DbUserRole>(
      `SELECT * FROM ${TABLE_NAMES.USER_ROLES} WHERE id = $1`,
      [user.role_id]
    )
    result.role_info = roleResult.rows[0] || undefined

    // Get permissions
    if (result.role_info) {
      result.permissions = await getRolePermissions(user.role_id)
    }
  }

  return result
}

