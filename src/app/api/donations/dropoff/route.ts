/**
 * POST /api/donations/dropoff — public donation drop-off announcement
 *
 * Mirrors the inquiry route shape (rate-limited, validated, two fire-and-
 * forget emails). No DB persist here: a drop-off announcement is an intent,
 * not a recorded donation — staff records the actual donation in
 * /admin/donations once the devices physically arrive. Keeping the public
 * route emails-only avoids forcing staff to deduplicate every donation row
 * against the visitor-typed device list.
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendCustomEmail } from '@/lib/email'
import {
  donationDropoffNotification,
  donationDropoffConfirmation,
} from '@/lib/email/templates/donation-dropoff'
import { CONTACT } from '@/config/org'
import { DonationDropoffSchema } from '@/lib/schemas/donations'

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, 'submission')
    if (!rateLimit.allowed) {
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED, {
        retryAfter: rateLimit.retryAfter,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      })
    }

    const body = await request.json()
    const result = DonationDropoffSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_INPUT, result.error.flatten().fieldErrors)
    }

    const fields = result.data

    // Both emails fire-and-forget so a transient SMTP failure doesn't
    // surface as a 500 to a donor who just filled out the form correctly.
    sendCustomEmail(
      CONTACT.email,
      donationDropoffNotification(fields),
    ).catch(err => logger.warn('Failed to send donation drop-off notification', { error: err, donorEmail: fields.email }))

    sendCustomEmail(
      fields.email,
      donationDropoffConfirmation(fields),
    ).catch(err => logger.warn('Failed to send donation drop-off confirmation', { error: err, donorEmail: fields.email }))

    logger.info('Donation drop-off announced', { donorEmail: fields.email, hasPreferredDate: !!fields.preferredDate })

    return apiSuccess({ message: 'Anmeldung erhalten' })
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Anmeldung')
  }
}
