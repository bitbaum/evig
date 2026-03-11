/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { userProfiles } from '@/db/schema/auth'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { validateBody, UpdateProfileSchema } from '@/lib/schemas'

/**
 * Get or create a user profile using Drizzle ORM.
 */
async function getOrCreateProfileDrizzle(userId: string) {
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))

  if (existing[0]) {
    return existing[0]
  }

  const [created] = await db
    .insert(userProfiles)
    .values({ userId })
    .returning()

  return created
}

export const GET = withAuth(async (request, session) => {
  try {
    const profile = await getOrCreateProfileDrizzle(session.user.id)
    return apiSuccess({ profile })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht geladen werden')
  }
})

export const PUT = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(UpdateProfileSchema, body)
    if (!validation.success) return validation.error
    const updateData = validation.data

    // Ensure profile exists
    await getOrCreateProfileDrizzle(session.user.id)

    // Build partial update object — only set fields that are present in updateData
    const setFields: Record<string, unknown> = {}

    const fieldMap: Record<string, keyof typeof userProfiles.$inferSelect> = {
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
      avatar_url: 'avatarUrl',
      display_name: 'displayName',
      bio: 'bio',
      profile_visibility: 'profileVisibility',
      show_email: 'showEmail',
      show_phone: 'showPhone',
      email_notifications: 'emailNotifications',
      sms_notifications: 'smsNotifications',
      marketplace_updates: 'marketplaceUpdates',
      workshop_reminders: 'workshopReminders',
    }

    for (const [dataKey, schemaKey] of Object.entries(fieldMap)) {
      if ((updateData as Record<string, unknown>)[dataKey] !== undefined) {
        setFields[schemaKey] = (updateData as Record<string, unknown>)[dataKey]
      }
    }

    if (Object.keys(setFields).length === 0) {
      const profile = await getOrCreateProfileDrizzle(session.user.id)
      return apiSuccess({ profile })
    }

    setFields.updatedAt = sql`NOW()`

    const [updatedProfile] = await db
      .update(userProfiles)
      .set(setFields)
      .where(eq(userProfiles.userId, session.user.id))
      .returning()

    return apiSuccess({
      profile: updatedProfile,
    })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht aktualisiert werden')
  }
})
