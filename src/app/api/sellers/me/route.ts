/**
 * GET  /api/sellers/me — Return own seller profile (authenticated)
 * PATCH /api/sellers/me — Update own seller profile (authenticated)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db';
import { sellerProfiles, userProfiles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { sellerProfileCoreFields } from '@/lib/services/seller-service';

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
        ...sellerProfileCoreFields,
        updated_at: sellerProfiles.updatedAt,
      })
      .from(sellerProfiles)
      .leftJoin(userProfiles, eq(sellerProfiles.userId, userProfiles.userId))
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

    // Identity fields live on user_profiles (SSOT); city/canton (storefront)
    // stay on seller_profiles. Split the write across the two owners.
    const identity: Record<string, unknown> = {};
    if (data.display_name !== undefined) identity.displayName = data.display_name;
    if (data.bio !== undefined) identity.bio = data.bio;
    if (data.avatar_url !== undefined) identity.avatarUrl = data.avatar_url;

    const sellerUpdate: Record<string, unknown> = {};
    if (data.city !== undefined) sellerUpdate.city = data.city;
    if (data.canton !== undefined) sellerUpdate.canton = data.canton;

    if (Object.keys(identity).length === 0 && Object.keys(sellerUpdate).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_CHANGES_SPECIFIED);
    }

    if (Object.keys(identity).length > 0) {
      await db
        .insert(userProfiles)
        .values({ userId: session.user.id, ...identity })
        .onConflictDoUpdate({ target: userProfiles.userId, set: identity });
    }

    // Always bump seller updatedAt so /me reflects the edit time.
    await db
      .update(sellerProfiles)
      .set({ ...sellerUpdate, updatedAt: sql`NOW()` })
      .where(eq(sellerProfiles.userId, session.user.id));

    // Re-read the joined profile (identity spans user_profiles) for the response.
    const [updated] = await db
      .select({
        ...sellerProfileCoreFields,
        updated_at: sellerProfiles.updatedAt,
      })
      .from(sellerProfiles)
      .leftJoin(userProfiles, eq(sellerProfiles.userId, userProfiles.userId))
      .where(eq(sellerProfiles.userId, session.user.id));

    logger.info('Seller profile updated', { userId: session.user.id });
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Verkäuferprofils');
  }
});
