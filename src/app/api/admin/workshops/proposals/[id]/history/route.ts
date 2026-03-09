import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshopProposals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import {
  apiError,
  apiSuccess,
  apiNotFound,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import type { EditHistoryEntry } from '@/lib/admin/edit-utils'

/**
 * GET /api/admin/workshops/proposals/[id]/history
 * Fetch edit history for a workshop proposal
 */
export const GET = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  const { id: proposalId } = context!.params!

  try {
    const [row] = await db
      .select({ editHistory: workshopProposals.editHistory })
      .from(workshopProposals)
      .where(eq(workshopProposals.id, proposalId))

    if (!row) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden')
    }

    const history = (row.editHistory as EditHistoryEntry[] | null) || []

    logger.info('Workshop proposal history fetched', {
      proposalId,
      adminId: session.user.id,
      entriesCount: history.length,
    })

    return apiSuccess({ history })
  } catch (error) {
    logger.error('Error fetching workshop proposal history', { error, proposalId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
