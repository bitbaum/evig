/**
 * GET /api/admin/appointments
 *
 * Admin listing of all service appointments — same shape as the user-facing
 * /api/appointments but without the customer/repairer filter. Reuses the
 * listAppointments service helper so the column selection + joins stay in
 * lockstep.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { listAppointments } from '@/lib/services/appointments'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export const GET = withAdmin('appointments-admin', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

    const data = await listAppointments({ status, limit, offset })
    return apiSuccess(data)
  } catch (error) {
    logger.error('Error fetching admin appointments', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
