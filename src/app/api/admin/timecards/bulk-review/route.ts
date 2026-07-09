/**
 * POST /api/admin/timecards/bulk-review
 *
 * Approves or rejects multiple timecards in one round-trip. The hot path
 * is "HR opens approval queue on Monday morning, ticks 18 of 20
 * obviously-clean weekly submissions, hits Approve" — that used to be
 * 18 separate PATCHes (each with its own 500 ms RTT plus a textarea
 * dance), now it's one.
 *
 * Per-id processing isolates failures: a single bad row (e.g. status
 * already approved by a parallel reviewer) returns a `failed` entry
 * rather than aborting the whole batch. The UI shows the partial-
 * success count + reasons. We do NOT wrap all reviews in one giant
 * transaction because each review fires its own notification + activity
 * log; a multi-second tx holding row locks while sending emails would
 * be exactly the long-lived-tx anti-pattern we already cleaned out of
 * other handlers.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { timecardBulkReviewSchema } from '@/lib/schemas/timecards'
import { reviewTimecard } from '@/lib/services/timecards'
import { isSuperAdmin } from '@/lib/permissions'

interface BulkResultItem {
  id: string
  ok: boolean
  error?: string
}

export const POST = withAdmin('timecards', async (
  request: NextRequest,
  session: ValidSession,
) => {
  try {
    const body = await request.json()
    const parsed = timecardBulkReviewSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const { ids, status, review_notes } = parsed.data

    // Super-admins may approve their own cards in a bulk pass too.
    const allowSelfReview = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

    const results: BulkResultItem[] = []
    let approved = 0
    let rejected = 0
    let failed = 0

    for (const id of ids) {
      try {
        await reviewTimecard(session.user.id, id, { status, review_notes }, { allowSelfReview })
        results.push({ id, ok: true })
        if (status === 'approved') approved += 1
        else rejected += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error'
        results.push({ id, ok: false, error: message })
        failed += 1
        logger.warn('Bulk-review skipped one timecard', { id, error: message, reviewerId: session.user.id })
      }
    }

    return apiSuccess({
      total: ids.length,
      approved,
      rejected,
      failed,
      results,
    })
  } catch (error) {
    logger.error('Error in bulk timecard review', { error, reviewerId: session.user.id })
    return apiError(error, 'Mehrfach-Freigabe konnte nicht ausgeführt werden')
  }
})
