/**
 * GET  /api/sellers/me — Return own seller profile (authenticated)
 * PATCH /api/sellers/me — Update own seller profile (authenticated)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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
    const result = await query<Record<string, unknown>>(
      `SELECT
        sp.id,
        sp.user_id,
        sp.display_name,
        sp.bio,
        sp.avatar_url,
        sp.city,
        sp.canton,
        sp.is_verified,
        sp.average_rating,
        sp.total_reviews,
        sp.total_listings,
        sp.total_sold,
        sp.created_at,
        sp.updated_at
      FROM ${TABLE_NAMES.SELLER_PROFILES} sp
      WHERE sp.user_id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return apiNotFound('Verkäuferprofil');
    }

    return apiSuccess(result.rows[0]);
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
    const existsResult = await query<{ user_id: string }>(
      `SELECT user_id FROM ${TABLE_NAMES.SELLER_PROFILES} WHERE user_id = $1`,
      [session.user.id]
    );

    if (existsResult.rows.length === 0) {
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
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben');
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of entries) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
    setClauses.push('updated_at = NOW()');
    values.push(session.user.id);

    const updateResult = await query<Record<string, unknown>>(
      `UPDATE ${TABLE_NAMES.SELLER_PROFILES}
       SET ${setClauses.join(', ')}
       WHERE user_id = $${idx}
       RETURNING id, user_id, display_name, bio, avatar_url, city, canton,
                 is_verified, average_rating, total_reviews, total_listings,
                 total_sold, created_at, updated_at`,
      values
    );

    logger.info('Seller profile updated', { userId: session.user.id });
    return apiSuccess(updateResult.rows[0]);
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Verkäuferprofils');
  }
});
