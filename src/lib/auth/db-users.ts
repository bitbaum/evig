/**
 * User and profile database queries
 *
 * Migrated to Drizzle ORM. Mapping functions convert Drizzle camelCase
 * results to the snake_case DbUser/DbUserProfile interfaces that
 * consumers expect.
 */

import { db } from '@/db'
import { users, userProfiles } from '@/db/schema/auth'
import type { User, UserProfile } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import type { SocialLinks, Availability, PurchaseHistoryItem } from '@/types/common'

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
  account_type: string
  last_activity_at: Date | null
  createdAt: Date  // camelCase for Auth.js
  updatedAt: Date  // camelCase for Auth.js
  // New simplified auth fields
  is_staff: boolean
  staff_permissions: string[]
  is_super_admin: boolean
  dashboard_mode: 'coordinator' | 'lead' | 'volunteer'
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

// ============================================================================
// Mapping helpers — Drizzle camelCase → consumer snake_case interfaces
// ============================================================================

function toDateOrNull(val: string | null | undefined): Date | null {
  return val ? new Date(val) : null
}

function toDate(val: string | null | undefined): Date {
  return val ? new Date(val) : new Date()
}

/**
 * Map a Drizzle User row to the DbUser interface consumers expect.
 */
function mapUserToDbUser(row: User): DbUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: toDateOrNull(row.emailVerified),
    password_hash: row.passwordHash,
    image: row.image,
    role: row.role ?? 'user',
    // These columns are not in the Drizzle schema; provide safe defaults
    status: 'active',
    role_id: null,
    account_type: 'individual',
    last_activity_at: null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    is_staff: row.isStaff ?? false,
    staff_permissions: row.staffPermissions ?? [],
    is_super_admin: row.isSuperAdmin ?? false,
    dashboard_mode: (row.dashboardMode as 'coordinator' | 'lead' | 'volunteer') ?? 'coordinator',
  }
}

/**
 * Map a Drizzle UserProfile row to the DbUserProfile interface consumers expect.
 */
function mapProfileToDbUserProfile(row: UserProfile): DbUserProfile {
  return {
    user_id: row.userId,
    first_name: row.firstName,
    last_name: row.lastName,
    company_name: row.companyName,
    phone: row.phone,
    mobile: row.mobile,
    address_line1: row.addressLine1,
    address_line2: row.addressLine2,
    postal_code: row.postalCode,
    city: row.city,
    canton: row.canton,
    country: row.country ?? 'Schweiz',
    interests: row.interests,
    preferred_language: row.preferredLanguage ?? 'de',
    newsletter_subscribed: row.newsletterSubscribed ?? false,
    is_supporter: row.isSupporter ?? false,
    supporter_type: row.supporterType,
    // These columns are not in the Drizzle schema; provide safe defaults
    date_of_birth: null,
    gender: null,
    occupation: null,
    // Public profile fields
    avatar_url: row.avatarUrl,
    display_name: row.displayName,
    bio: row.bio,
    profile_visibility: row.profileVisibility,
    // Privacy settings
    show_email: row.showEmail,
    show_phone: row.showPhone,
    // Notification preferences
    email_notifications: row.emailNotifications,
    sms_notifications: row.smsNotifications,
    marketplace_updates: row.marketplaceUpdates,
    workshop_reminders: row.workshopReminders,
    // Service provider fields — not in Drizzle schema
    website: null,
    social_links: null,
    skills: null,
    expertise_areas: null,
    availability: null,
    service_radius_km: null,
    // CRM fields — not in Drizzle schema
    customer_segment: null,
    purchase_history: null,
    loyalty_points: null,
    created_at: toDate(row.createdAt),
    updated_at: toDate(row.updatedAt),
  }
}

// ============================================================================
// User queries
// ============================================================================

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
  return rows[0] ? mapUserToDbUser(rows[0]) : null
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<DbUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return rows[0] ? mapUserToDbUser(rows[0]) : null
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
  emailVerified?: boolean
  // New simplified auth fields
  is_staff?: boolean
  staff_permissions?: string[]
}): Promise<DbUser> {
  const rows = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      name: data.name ?? null,
      passwordHash: data.password_hash ?? null,
      image: data.image ?? null,
      role: data.role ?? 'user',
      emailVerified: data.emailVerified ? new Date().toISOString() : null,
      isStaff: data.is_staff ?? false,
      staffPermissions: data.staff_permissions ?? [],
    })
    .returning()

  return mapUserToDbUser(rows[0])
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<DbUser, 'name' | 'email' | 'emailVerified' | 'password_hash' | 'image' | 'role' | 'status' | 'account_type'>>
): Promise<DbUser | null> {
  // Build the set object with only defined fields
  const setValues: Record<string, unknown> = {}

  if (data.name !== undefined) {
    setValues.name = data.name
  }
  if (data.email !== undefined) {
    setValues.email = data.email.toLowerCase()
  }
  if (data.emailVerified !== undefined) {
    setValues.emailVerified = data.emailVerified
      ? (data.emailVerified instanceof Date ? data.emailVerified.toISOString() : String(data.emailVerified))
      : null
  }
  if (data.password_hash !== undefined) {
    setValues.passwordHash = data.password_hash
  }
  if (data.image !== undefined) {
    setValues.image = data.image
  }
  if (data.role !== undefined) {
    setValues.role = data.role
  }
  // status and account_type are not in the Drizzle schema — skip silently

  if (Object.keys(setValues).length === 0) {
    return getUserById(id)
  }

  // Always bump updatedAt
  setValues.updatedAt = new Date().toISOString()

  const rows = await db
    .update(users)
    .set(setValues)
    .where(eq(users.id, id))
    .returning()

  return rows[0] ? mapUserToDbUser(rows[0]) : null
}

// ============================================================================
// Profile queries
// ============================================================================

/**
 * Get or create user profile
 */
export async function getOrCreateProfile(userId: string): Promise<DbUserProfile> {
  // Try to get existing profile
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  if (existing[0]) {
    return mapProfileToDbUserProfile(existing[0])
  }

  // Create new profile
  const rows = await db
    .insert(userProfiles)
    .values({ userId })
    .returning()

  return mapProfileToDbUserProfile(rows[0])
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: Partial<Omit<DbUserProfile, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DbUserProfile | null> {
  // Map snake_case data keys to camelCase Drizzle column names
  const setValues: Record<string, unknown> = {}

  const fieldMapping: Record<string, string> = {
    first_name: 'firstName',
    last_name: 'lastName',
    company_name: 'companyName',
    phone: 'phone',
    mobile: 'mobile',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    postal_code: 'postalCode',
    city: 'city',
    canton: 'canton',
    country: 'country',
    interests: 'interests',
    preferred_language: 'preferredLanguage',
    newsletter_subscribed: 'newsletterSubscribed',
    is_supporter: 'isSupporter',
    supporter_type: 'supporterType',
    // Public profile fields
    avatar_url: 'avatarUrl',
    display_name: 'displayName',
    bio: 'bio',
    profile_visibility: 'profileVisibility',
    // Privacy settings
    show_email: 'showEmail',
    show_phone: 'showPhone',
    // Notification preferences
    email_notifications: 'emailNotifications',
    sms_notifications: 'smsNotifications',
    marketplace_updates: 'marketplaceUpdates',
    workshop_reminders: 'workshopReminders',
    // Fields not in Drizzle schema are omitted:
    // date_of_birth, gender, occupation, website, social_links,
    // skills, expertise_areas, availability, service_radius_km,
    // customer_segment, purchase_history, loyalty_points
  }

  for (const [snakeKey, camelKey] of Object.entries(fieldMapping)) {
    const value = (data as Record<string, unknown>)[snakeKey]
    if (value !== undefined) {
      setValues[camelKey] = value
    }
  }

  if (Object.keys(setValues).length === 0) {
    return getOrCreateProfile(userId)
  }

  // Always bump updatedAt
  setValues.updatedAt = new Date().toISOString()

  const rows = await db
    .update(userProfiles)
    .set(setValues)
    .where(eq(userProfiles.userId, userId))
    .returning()

  return rows[0] ? mapProfileToDbUserProfile(rows[0]) : null
}
