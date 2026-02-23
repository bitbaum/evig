import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { getStripeClient } from '@/lib/payments/stripe-client'
import { TABLE_NAMES } from '@/config/database'
import {
  processPaymentWithoutInvoice,
  centsToDisplay,
  DEFAULT_AUTO_RELEASE_DAYS
} from '@/lib/payments/payment-flow'

interface AppointmentRow {
  id: string
  user_id: string
  status: string
  price_charged_cents: number
  service_price_cents: number
  service_name: string
  service_slug: string
  requires_approval: boolean
  customer_name: string
  customer_email: string
}

interface PaidRow {
  total_paid: number
}

// POST /api/appointments/[id]/pay - Pay for existing appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentifizierung erforderlich')
    }

    const appointmentId = request.nextUrl.pathname.split('/')[3] // Extract ID from URL
    const {
      useEscrow = true,
      autoReleaseDays = DEFAULT_AUTO_RELEASE_DAYS,
      paymentType = 'full', // 'full', 'deposit', 'remaining'
      customAmount // For custom payment amounts
    } = await request.json()

    // Get appointment details
    const appointmentResult = await query(`
      SELECT
        sa.*,
        st.name as service_name,
        st.slug as service_slug,
        st.price_cents as service_price_cents,
        st.requires_approval,
        u.name as customer_name,
        u.email as customer_email
      FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
      JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
      JOIN ${TABLE_NAMES.USERS} u ON sa.user_id = u.id
      WHERE sa.id = $1
    `, [appointmentId])

    if (appointmentResult.rows.length === 0) {
      return apiNotFound('Termin')
    }

    const appointment = appointmentResult.rows[0] as AppointmentRow

    // Check ownership - owner or admin can pay
    if (appointment.user_id !== session.user.id && !session.user.isStaff) {
      return apiUnauthorized('Sie können nur für Ihre eigenen Termine bezahlen')
    }

    // Check if appointment is in payable status
    if (!['confirmed', 'approved', 'in_progress'].includes(appointment.status)) {
      return apiBadRequest(`Terminstatus '${appointment.status}' ist nicht zahlbar`)
    }

    // Determine payment amount
    let paymentAmountCents = appointment.price_charged_cents || appointment.service_price_cents || 0

    if (paymentType === 'deposit') {
      // 30% deposit
      paymentAmountCents = Math.round(paymentAmountCents * 0.3)
    } else if (paymentType === 'remaining') {
      // Calculate remaining balance
      const paidResult = await query(`
        SELECT COALESCE(SUM(amount_cents), 0) as total_paid
        FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
        WHERE service_appointment_id = $1 AND status = 'succeeded' AND type = 'payment'
      `, [appointmentId])

      const paid = paidResult.rows[0] as PaidRow
      const totalPaid = paid.total_paid
      const remaining = paymentAmountCents - totalPaid

      if (remaining <= 0) {
        return apiBadRequest('Termin ist bereits vollständig bezahlt')
      }

      paymentAmountCents = remaining
    } else if (customAmount) {
      paymentAmountCents = Math.round(parseFloat(customAmount) * 100)
    }

    if (paymentAmountCents <= 0) {
      return apiBadRequest('Ungültiger Zahlungsbetrag')
    }

    // Initialize Stripe
    const stripe = getStripeClient()
    if (!stripe) {
      return apiError(new Error('Stripe not configured'), 'Stripe ist nicht konfiguriert')
    }

    // Capitalize first letter of payment type for description
    const paymentTypeLabel = paymentType.charAt(0).toUpperCase() + paymentType.slice(1)

    // Process payment using shared utility (without invoice - appointment already has one)
    const paymentResult = await processPaymentWithoutInvoice({
      stripe,
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
      transactionMetadata: {
        paymentType,
        originalAppointmentStatus: appointment.status
      }
    })

    // Update appointment status if this completes the payment
    if (paymentType === 'full' || paymentType === 'remaining') {
      await query(`
        UPDATE ${TABLE_NAMES.SERVICE_APPOINTMENTS}
        SET
          status = CASE
            WHEN status = 'confirmed' THEN 'paid'
            WHEN status = 'approved' THEN 'paid'
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [appointmentId])
    }

    return apiSuccess({
      appointmentId,
      paymentIntentId: paymentResult.paymentIntentId,
      clientSecret: paymentResult.clientSecret,
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
