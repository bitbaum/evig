import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return apiBadRequest('Bestätigungstoken fehlt')
    }

    // Find pending subscriber with this token and confirm in one atomic operation
    const { rows } = await query<{ email: string }>(
      `UPDATE ${TABLE_NAMES.NEWSLETTER_SUBSCRIPTIONS}
       SET is_active = true, confirmed_at = NOW(), confirm_token = NULL
       WHERE confirm_token = $1 AND is_active = false
       RETURNING email`,
      [token]
    )

    if (rows.length === 0) {
      return apiBadRequest('Ungültiger oder bereits verwendeter Bestätigungslink')
    }

    logger.info('Newsletter subscription confirmed', { email: rows[0].email })

    return apiSuccess({
      message: 'Newsletter-Anmeldung erfolgreich bestätigt! Sie erhalten ab sofort unsere Neuigkeiten.',
    })
  } catch (error) {
    return apiError(error, 'Fehler bei der Bestätigung')
  }
}
