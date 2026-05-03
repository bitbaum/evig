import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { sql, eq, and, getTableName } from 'drizzle-orm'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema/workshops'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { PAYMENT_STATUS } from '@/config/payment-status'
import {
  processPayment,
  buildInvoiceLineItem,
  centsToDisplay
} from '@/lib/payments/payment-flow'
import { validateBody, WorkshopRegisterWithPaymentSchema } from '@/lib/schemas'
import { APP_URL } from '@/config/urls'

interface WorkshopRow {
  id: string
  title: string
  price_cents: number
  slug: string
  is_active: boolean
}

interface InstanceRow {
  id: string
  title: string
  workshop_price: number
  current_participants: number
  max_participants: number
  status: string
}

// Table name refs
const wTable = getTableName(workshops)
const wiTable = getTableName(workshopInstances)

// POST /api/workshops/[slug]/register-with-payment - Register for workshop with payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
    }

    const workshopSlug = request.nextUrl.pathname.split('/')[3] // Extract slug from URL
    const body = await request.json()
    const validation = validateBody(WorkshopRegisterWithPaymentSchema, body)
    if (!validation.success) return validation.error
    const {
      instanceId,
      useEscrow,
    } = validation.data

    // Get workshop details
    const workshopResult = await db.execute(sql`
      SELECT
        w.*,
        COALESCE(w.price_cents, 0) as price_cents
      FROM ${sql.raw(wTable)} w
      WHERE w.slug = ${workshopSlug} AND w.is_active = true
    `)

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop nicht gefunden')
    }

    const workshop = workshopResult.rows[0] as unknown as WorkshopRow

    if (!workshop.price_cents || workshop.price_cents <= 0) {
      return apiBadRequest('Dieser Workshop ist nicht für die Online-Anmeldung mit Zahlung verfügbar')
    }

    // Get workshop instance if specified, otherwise use general workshop
    let instanceDetails: InstanceRow | null = null
    let registrationTarget: string = workshop.id
    let registrationType = 'workshop'

    if (instanceId) {
      const instanceResult = await db.execute(sql`
        SELECT
          wi.*,
          w.title,
          w.price_cents as workshop_price
        FROM ${sql.raw(wiTable)} wi
        JOIN ${sql.raw(wTable)} w ON wi.workshop_id = w.id
        WHERE wi.id = ${instanceId} AND wi.status = ${WORKSHOP_INSTANCE_STATUS.SCHEDULED}
      `)

      if (instanceResult.rows.length === 0) {
        return apiNotFound('Workshop-Termin nicht gefunden oder nicht verfügbar')
      }

      instanceDetails = instanceResult.rows[0] as unknown as InstanceRow
      registrationTarget = instanceId
      registrationType = 'instance'

      // Check capacity
      if (instanceDetails.current_participants >= instanceDetails.max_participants) {
        return apiBadRequest('Workshop-Termin ist ausgebucht')
      }
    }

    // Check if user is already registered
    const existingRegistration = await db.select({
      id: workshopRegistrations.id,
      status: workshopRegistrations.status,
    })
      .from(workshopRegistrations)
      .where(
        and(
          eq(workshopRegistrations.userId, session.user.id),
          eq(workshopRegistrations.workshopInstanceId, registrationTarget)
        )
      )

    if (existingRegistration.length > 0) {
      const reg = existingRegistration[0]
      if (reg.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED || reg.status === WORKSHOP_REGISTRATION_STATUS.ATTENDED) {
        return apiBadRequest('Sie sind bereits für diesen Workshop angemeldet')
      }
    }

    const baseAmount = workshop.price_cents

    // Wrap registration + participant count update in transaction
    const registrationId = await db.transaction(async (tx) => {
      const [createdReg] = await tx.insert(workshopRegistrations).values({
        userId: session.user.id,
        workshopInstanceId: registrationTarget,
        status: WORKSHOP_REGISTRATION_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentAmountCents: baseAmount,
      }).returning({ id: workshopRegistrations.id })

      // Update instance participant count if registering for specific instance
      if (instanceId) {
        await tx.execute(sql`
          UPDATE ${sql.raw(wiTable)}
          SET current_participants = current_participants + 1
          WHERE id = ${instanceId}
        `)
      }

      return createdReg.id
    })

    // Process payment using shared utility
    const autoReleaseDays = 1
    const paymentResult = await processPayment({
      userId: session.user.id,
      baseAmountCents: baseAmount,
      useEscrow,
      autoReleaseDays,
      paymentDescription: `Workshop Registration: ${workshop.title}`,
      paymentMetadata: {
        userId: session.user.id,
        workshopRegistrationId: registrationId.toString(),
        workshopSlug,
        instanceId: instanceId || '',
        useEscrow: useEscrow.toString(),
        registrationType
      },
      workshopRegistrationId: registrationId,
      successRedirectUrl: `${APP_URL}/dashboard/workshops?payment=success`,
      failedRedirectUrl: `${APP_URL}/workshops/${workshopSlug}?payment=failed`,
      cancelRedirectUrl: `${APP_URL}/workshops/${workshopSlug}?payment=cancelled`,
      purpose: `Workshop: ${workshop.title}`,
      invoiceLineItems: [
        buildInvoiceLineItem(
          `Workshop: ${workshop.title}`,
          baseAmount
        )
      ],
      invoiceNotes: `Workshop registration - ${workshop.title}`,
      invoicePaymentTerms: 'Payment due before workshop date'
    })

    return apiSuccess({
      registrationId,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      invoiceId: paymentResult.invoiceId,
      invoiceNumber: paymentResult.invoiceNumber,
      amount: centsToDisplay(paymentResult.totalAmountCents),
      currency: paymentResult.currency,
      workshopTitle: workshop.title,
      registrationType,
      escrowEnabled: useEscrow,
      message: 'Workshop-Anmeldung erstellt. Schliesse die Zahlung ab, um deinen Platz zu bestätigen.'
    })
  } catch (error) {
    logger.error('Workshop registration with payment error', { error })
    return apiError(error, 'Workshop-Anmeldung mit Zahlung fehlgeschlagen')
  }
}
