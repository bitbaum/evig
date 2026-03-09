/**
 * GET  /api/sellers/me — Return own seller profile (authenticated)
 * PATCH /api/sellers/me — Update own seller profile (authenticated)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { sellerProfiles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// Validation
// ============================================================================

const UpdateSellerProfileSchema = z.object({
  display_name: z.string().min(1, 'Anzeigename ist erforderlich').max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url('Ungültige URL').max(500).optional(),
  city: z.string().max(100).optional(),
  canton: z.string().max(2).optional(),
});

// ============================================================================
// GET — Own seller profile
// ============================================================================

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const [profile] = await db
      .select({
        id: sellerProfiles.id,
        user_id: sellerProfiles.userId,
        display_name: sellerProfiles.displayName,
        bio: sellerProfiles.bio,
        avatar_url: sellerProfiles.avatarUrl,
        city: sellerProfiles.city,
        canton: sellerProfiles.canton,
        is_verified: sellerProfiles.isVerified,
        average_rating: sellerProfiles.averageRating,
        total_reviews: sellerProfiles.totalReviews,
        total_listings: sellerProfiles.totalListings,
        total_sold: sellerProfiles.totalSold,
        created_at: sellerProfiles.createdAt,
        updated_at: sellerProfiles.updatedAt,
      })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, session.user.id));

    if (!profile) {
      return apiNotFound('Verkäuferprofil');
    }

    return apiSuccess(profile);
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Verkäuferprofils');
  }
});

// ============================================================================
// PATCH — Update own seller profile
// ============================================================================

export const PATCH = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    // Verify the seller profile exists
    const [exists] = await db
      .select({ userId: sellerProfiles.userId })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, session.user.id));

    if (!exists) {
      return apiNotFound('Verkäuferprofil');
    }

    const body = await request.json();
    const parsed = UpdateSellerProfileSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiBadRequest('Ungültige Eingabedaten', fieldErrors);
    }

    const data = parsed.data;

    // Build dynamic UPDATE from validated fields
    const update: Record<string, unknown> = {};
    if (data.display_name !== undefined) update.displayName = data.display_name;
    if (data.bio !== undefined) update.bio = data.bio;
    if (data.avatar_url !== undefined) update.avatarUrl = data.avatar_url;
    if (data.city !== undefined) update.city = data.city;
    if (data.canton !== undefined) update.canton = data.canton;

    if (Object.keys(update).length === 0) {
      return apiBadRequest('Keine Änderungen angegeben');
    }

    update.updatedAt = sql`NOW()`;

    const [updated] = await db
      .update(sellerProfiles)
      .set(update)
      .where(eq(sellerProfiles.userId, session.user.id))
      .returning({
        id: sellerProfiles.id,
        user_id: sellerProfiles.userId,
        display_name: sellerProfiles.displayName,
        bio: sellerProfiles.bio,
        avatar_url: sellerProfiles.avatarUrl,
        city: sellerProfiles.city,
        canton: sellerProfiles.canton,
        is_verified: sellerProfiles.isVerified,
        average_rating: sellerProfiles.averageRating,
        total_reviews: sellerProfiles.totalReviews,
        total_listings: sellerProfiles.totalListings,
        total_sold: sellerProfiles.totalSold,
        created_at: sellerProfiles.createdAt,
        updated_at: sellerProfiles.updatedAt,
      });

    logger.info('Seller profile updated', { userId: session.user.id });
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Verkäuferprofils');
  }
});
