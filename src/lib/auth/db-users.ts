/**
 * User and profile database queries
 */

import { TABLE_NAMES } from '@/config/database'
import type { QueryParams, SocialLinks, Availability, PurchaseHistoryItem } from '@/types/common'
import { query, getUserColumns } from './db-connection'
import type { DbUserRole } from './db-roles'

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
  role: string  // Legacy - kept for backward compatibility
  status: string
  role_id: string | null
  medusa_customer_id: string | null
  account_type: string
  last_activity_at: Date | null
  createdAt: Date  // camelCase for Auth.js
  updatedAt: Date  // camelCase for Auth.js
  // New simplified auth fields
  is_staff: boolean
  staff_permissions: string[]
  is_super_admin: boolean
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
  // Public profile fields
  avatar_url: string | null
  display_name: string | null
  bio: string | null
  profile_visibility: string | null
  // Privacy settings
  show_email: boolean | null
  show_phone: boolean | null
  // Notification preferences
  email_notifications: boolean | null
  sms_notifications: boolean | null
  marketplace_updates: boolean | null
  workshop_reminders: boolean | null
  // Service provider fields
  website: string | null
  social_links: SocialLinks | null
  skills: string[] | null
  expertise_areas: string[] | null
  availability: Availability | null
  service_radius_km: number | null
  // CRM fields
  customer_segment: string | null
  purchase_history: PurchaseHistoryItem[] | null
  loyalty_points: number | null
  created_at: Date
  updated_at: Date
}

/**
 * Donation record (monetary or device)
 */
export interface DbDonation {
  id: string
  user_id: string | null

  // Type discriminator
  donation_type: 'monetary' | 'device'

  // Monetary donation fields
  amount_cents: number | null
  currency: string
  payment_method: string | null
  payment_reference: string | null
  payment_date: Date | null

  // Recurring donation fields
  is_recurring: boolean
  recurring_frequency: string | null

  // Device donation fields
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  device_age_years: number | null
  estimated_value_cents: number | null

  // Anonymous donor fields
  donor_name: string | null
  donor_email: string | null
  donor_address: string | null

  // Receipt/acknowledgment
  receipt_requested: boolean
  receipt_sent: boolean
  receipt_sent_at: Date | null

  // Admin tracking
  status: string
  recorded_by: string | null
  notes: string | null
  thank_you_sent: boolean
  thank_you_sent_at: Date | null

  // Timestamps
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
 * @param data.emailVerified - If true, sets email as verified. If false/undefined, email remains unverified.
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
  emailVerified?: boolean
  // New simplified auth fields
  is_staff?: boolean
  staff_permissions?: string[]
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

  // Only set emailVerified if explicitly requested (for OAuth or admin-created accounts)
  if (data.emailVerified) {
    if (userColumns.has('emailVerified')) {
      columns.push('"emailVerified"')
      values.push(new Date())
    } else if (userColumns.has('email_verified')) {
      columns.push('email_verified')
      values.push(new Date())
    }
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

  // New simplified auth fields
  if (userColumns.has('is_staff')) {
    columns.push('is_staff')
    values.push(data.is_staff ?? false)
  }

  if (userColumns.has('staff_permissions')) {
    columns.push('staff_permissions')
    values.push(data.staff_permissions ?? [])
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
    // Public profile fields
    avatar_url: 'avatar_url',
    display_name: 'display_name',
    bio: 'bio',
    profile_visibility: 'profile_visibility',
    // Privacy settings
    show_email: 'show_email',
    show_phone: 'show_phone',
    // Notification preferences
    email_notifications: 'email_notifications',
    sms_notifications: 'sms_notifications',
    marketplace_updates: 'marketplace_updates',
    workshop_reminders: 'workshop_reminders',
    // Service provider fields
    website: 'website',
    social_links: 'social_links',
    skills: 'skills',
    expertise_areas: 'expertise_areas',
    availability: 'availability',
    service_radius_km: 'service_radius_km',
    // CRM fields
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
