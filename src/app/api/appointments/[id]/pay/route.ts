import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, paymentTransactions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { PAYMENT_STATUS } from '@/config/payment-status'
import {
  processPaymentWithoutInvoice,
  centsToDisplay,
  DEFAULT_AUTO_RELEASE_DAYS
} from '@/lib/payments/payment-flow'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { BOOKING_STATUS } from '@/config/booking-status'
import { validateBody, PayAppointmentSchema } from '@/lib/schemas'

// POST /api/appointments/[id]/pay - Pay for existing appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentifizierung erforderlich')
    }

    const appointmentId = request.nextUrl.pathname.split('/')[3] // Extract ID from URL
    const body = await request.json()
    const validation = validateBody(PayAppointmentSchema, body)
    if (!validation.success) return validation.error
    const {
      useEscrow,
      autoReleaseDays,
      paymentType,
      customAmount
    } = validation.data

    // Get appointment details
    const [appointment] = await db
      .select({
        id: serviceAppointments.id,
        user_id: serviceAppointments.userId,
        status: serviceAppointments.status,
        price_charged_cents: serviceAppointments.priceChargedCents,
        service_price_cents: serviceTypes.priceCents,
        service_name: serviceTypes.name,
        service_slug: serviceTypes.slug,
        requires_approval: serviceTypes.requiresApproval,
        customer_name: users.name,
        customer_email: users.email,
      })
      .from(serviceAppointments)
      .innerJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
      .innerJoin(users, eq(serviceAppointments.userId, users.id))
      .where(eq(serviceAppointments.id, appointmentId))

    if (!appointment) {
      return apiNotFound('Termin')
    }

    // Check ownership - owner or admin can pay
    if (appointment.user_id !== session.user.id && !session.user.isStaff) {
      return apiUnauthorized('Sie können nur für Ihre eigenen Termine bezahlen')
    }

    // Check if appointment is in payable status
    if (![APPOINTMENT_STATUS.CONFIRMED, 'approved', BOOKING_STATUS.IN_PROGRESS].includes(appointment.status!)) {
      return apiBadRequest(`Terminstatus '${appointment.status}' ist nicht zahlbar`)
    }

    // Determine payment amount
    let paymentAmountCents = appointment.price_charged_cents || appointment.service_price_cents || 0

    if (paymentType === 'deposit') {
      // 30% deposit
      paymentAmountCents = Math.round(paymentAmountCents * 0.3)
    } else if (paymentType === 'remaining') {
      // Calculate remaining balance
      const [paidRow] = await db
        .select({
          total_paid: sql<number>`COALESCE(SUM(${paymentTransactions.amountCents}), 0)`,
        })
        .from(paymentTransactions)
        .where(and(
          eq(paymentTransactions.serviceAppointmentId, appointmentId),
          eq(paymentTransactions.status, PAYMENT_STATUS.SUCCEEDED),
          eq(paymentTransactions.type, 'payment')
        ))

      const totalPaid = paidRow?.total_paid ?? 0
      const remaining = paymentAmountCents - totalPaid

      if (remaining <= 0) {
        return apiBadRequest('Termin ist bereits vollständig bezahlt')
      }

      paymentAmountCents = remaining
    } else if (customAmount) {
      paymentAmountCents = Math.round(parseFloat(String(customAmount)) * 100)
    }

    if (paymentAmountCents <= 0) {
      return apiBadRequest('Ungültiger Zahlungsbetrag')
    }

    // Build redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Capitalize first letter of payment type for description
    const paymentTypeLabel = paymentType.charAt(0).toUpperCase() + paymentType.slice(1)

    // Process payment using shared utility (without invoice - appointment already has one)
    const paymentResult = await processPaymentWithoutInvoice({
      userId: session.user.id,
      baseAmountCents: paymentAmountCents,
      useEscrow,
      autoReleaseDays,
      paymentDescription: `${paymentTypeLabel} payment for ${appointment.service_name}`,
      paymentMetadata: {
        userId: session.user.id,
        serviceAppointmentId: appointmentId,
        useEscrow: useEscrow.toString(),
        autoReleaseDays: autoReleaseDays.toString(),
        paymentType,
        appointmentType: 'service_payment'
      },
      serviceAppointmentId: appointmentId,
      successRedirectUrl: `${baseUrl}/dashboard/appointments?payment=success`,
      failedRedirectUrl: `${baseUrl}/dashboard/appointments/${appointmentId}?payment=failed`,
      cancelRedirectUrl: `${baseUrl}/dashboard/appointments/${appointmentId}?payment=cancelled`,
      purpose: `${paymentTypeLabel}: ${appointment.service_name}`,
      transactionMetadata: {
        paymentType,
        originalAppointmentStatus: appointment.status
      }
    })

    // Update appointment status if this completes the payment
    if (paymentType === 'full' || paymentType === 'remaining') {
      await db
        .update(serviceAppointments)
        .set({
          status: sql`CASE
            WHEN ${serviceAppointments.status} = ${APPOINTMENT_STATUS.CONFIRMED} THEN 'paid'
            WHEN ${serviceAppointments.status} = 'approved' THEN 'paid'
            ELSE ${serviceAppointments.status}
          END`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(serviceAppointments.id, appointmentId))
    }

    return apiSuccess({
      appointmentId,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      amount: centsToDisplay(paymentResult.totalAmountCents),
      currency: paymentResult.currency,
      paymentType,
      escrowEnabled: useEscrow,
      message: useEscrow
        ? `Zahlung autorisiert. Der Betrag wird bis zur Dienstleistungserbringung treuhänderisch verwahrt.`
        : `Zahlung erfolgreich verarbeitet!`
    })

  } catch (error) {
    logger.error('Pay for appointment error', { error })
    return apiError(error, 'Zahlung für Termin konnte nicht verarbeitet werden')
  }
}
