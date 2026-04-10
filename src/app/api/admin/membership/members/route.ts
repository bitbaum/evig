import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

/**
 * GET /api/admin/membership/members
 * Returns all active Verein members for decision invitation.
 * Used by decision creation form to auto-invite members to votes.
 */
export const GET = withAdmin(async (_request: NextRequest) => {
  try {
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.isMember, true))
      .orderBy(asc(users.name))

    return apiSuccess(members)
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Mitgliederliste')
  }
})
