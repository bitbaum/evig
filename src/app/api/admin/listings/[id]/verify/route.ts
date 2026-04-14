/**
 * POST /api/admin/listings/[id]/verify — Admin: mark listing as verified
 * DELETE /api/admin/listings/[id]/verify — Admin: remove verification
 *
 * Only staff members can verify listings (RevampIT workshop-tested items).
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { listings } from '@/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, VerifyListingSchema } from '@/lib/schemas'
import { LISTING_STATUS } from '@/config/marketplace'

type RouteContext = { params?: { id: string } }

// ============================================================================
// POST — Verify listing
// ============================================================================

export const POST = withAdmin<{ id: string }>('marketplace', async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Inserat')

    const body = await request.json()
    const validation = validateBody(VerifyListingSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    // Check listing exists
    const [existing] = await db
      .select({ id: listings.id, status: listings.status })
      .from(listings)
      .where(and(eq(listings.id, id), ne(listings.status, LISTING_STATUS.REMOVED)))

    if (!existing) return apiNotFound('Inserat')

    // Set verification
    await db
      .update(listings)
      .set({
        verifiedAt: sql`NOW()`,
        verifiedBy: session.user.id,
        verificationNotes: data.verification_notes || null,
      })
      .where(eq(listings.id, id))

    logger.info('Listing verified', { listingId: id, verifiedBy: session.user.id })

    return apiSuccess({ id, verified: true })
  } catch (error) {
    return apiError(error, 'Fehler beim Verifizieren des Inserats')
  }
})

// ============================================================================
// DELETE — Remove verification
// ============================================================================

export const DELETE = withAdmin<{ id: string }>('marketplace', async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiNotFound('Inserat')

    await db
      .update(listings)
      .set({
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
      })
      .where(eq(listings.id, id))

    logger.info('Listing verification removed', { listingId: id, removedBy: session.user.id })

    return apiSuccess({ id, verified: false })
  } catch (error) {
    return apiError(error, 'Fehler beim Entfernen der Verifizierung')
  }
})
