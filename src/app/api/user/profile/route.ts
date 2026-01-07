/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextRequest } from 'next/server'
import { getOrCreateProfile, updateProfile } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'

export const GET = withAuth(async (request, session) => {
  try {
    const profile = await getOrCreateProfile(session.user.id)
    return apiSuccess({ profile })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht geladen werden')
  }
})

interface ProfileUpdateData {
  // Basic contact info
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  mobile?: string;
  // Address
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  canton?: string;
  country?: string;
  // Preferences
  preferred_language?: string;
  newsletter_subscribed?: boolean;
  interests?: string[];
  // Service provider fields (for repairers/sellers)
  bio?: string;
  website?: string;
  skills?: string[];
  expertise_areas?: string[];
  service_radius_km?: number;
  availability?: Record<string, unknown>;
}

export const PUT = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json() as Partial<ProfileUpdateData>

    // Validate and sanitize input
    const allowedFields: (keyof ProfileUpdateData)[] = [
      // Basic contact info
      'first_name',
      'last_name',
      'company_name',
      'phone',
      'mobile',
      // Address
      'address_line1',
      'address_line2',
      'postal_code',
      'city',
      'canton',
      'country',
      // Preferences
      'preferred_language',
      'newsletter_subscribed',
      'interests',
      // Service provider fields (for repairers/sellers)
      'bio',
      'website',
      'skills',
      'expertise_areas',
      'service_radius_km',
      'availability',
    ]

    const updateData: Partial<ProfileUpdateData> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updatedProfile = await updateProfile(session.user.id, updateData)

    return apiSuccess({
      profile: updatedProfile,
    })
  } catch (error) {
    return apiError(error, 'Profil konnte nicht aktualisiert werden')
  }
})







