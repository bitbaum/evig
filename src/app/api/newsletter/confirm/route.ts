import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { newsletterSubscriptions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return apiBadRequest('Bestätigungstoken fehlt')
    }

    // Find pending subscriber with this token and confirm in one atomic operation
    const [confirmed] = await db
      .update(newsletterSubscriptions)
      .set({
        isActive: true,
        confirmedAt: sql`NOW()`,
        confirmToken: null,
      })
      .where(and(
        eq(newsletterSubscriptions.confirmToken, token),
        eq(newsletterSubscriptions.isActive, false),
      ))
      .returning({ email: newsletterSubscriptions.email })

    if (!confirmed) {
      return apiBadRequest('Ungültiger oder bereits verwendeter Bestätigungslink')
    }

    logger.info('Newsletter subscription confirmed', { email: confirmed.email })

    return apiSuccess({
      message: 'Newsletter-Anmeldung erfolgreich bestätigt! Sie erhalten ab sofort unsere Neuigkeiten.',
    })
  } catch (error) {
    return apiError(error, 'Fehler bei der Bestätigung')
  }
}
