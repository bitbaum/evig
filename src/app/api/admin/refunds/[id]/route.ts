import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { isAdminRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { getStripeClient } from '@/lib/payments/stripe-client'

// GET /api/admin/refunds/[id] - Get refund details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: refundId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    // Check if user is admin
    const userRoleResult = await query(`SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`, [session.user.id])
    if (!isAdminRole(userRoleResult.rows[0]?.role)) {
      return apiUnauthorized('Admin access required')
    }

    // Get refund details with related data
    const refundResult = await query(`
      SELECT
        r.*,
        u.name as customer_name,
        u.email as customer_email,
        pt.amount_cents / 100.0 as original_amount,
        pt.currency,
        pt.provider_transaction_id,
        ROUND(r.amount_cents / 100.0, 2) as refund_amount,
        ar.name as approved_by_name,
        rr.name as requested_by_name,
        pr.name as processed_by_name
      FROM ${TABLE_NAMES.REFUNDS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requested_by = u.id
      JOIN ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt ON r.original_transaction_id = pt.id
      LEFT JOIN ${TABLE_NAMES.USERS} ar ON r.approved_by = ar.id
      LEFT JOIN ${TABLE_NAMES.USERS} rr ON r.requested_by = rr.id
      LEFT JOIN ${TABLE_NAMES.USERS} pr ON r.processed_by = pr.id
      WHERE r.id = $1
    `, [refundId])

    if (refundResult.rows.length === 0) {
      return apiNotFound('Refund not found')
    }

    const refund = refundResult.rows[0]

    return apiSuccess({ refund })

  } catch (error) {
    logger.error('Get admin refund error', { error })
    return apiError(error, 'Failed to retrieve refund')
  }
}

// PUT /api/admin/refunds/[id] - Approve/reject/process refund
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: refundId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required')
    }

    // Check if user is admin
    const userRoleResult = await query(`SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`, [session.user.id])
    if (!isAdminRole(userRoleResult.rows[0]?.role)) {
      return apiUnauthorized('Admin access required')
    }
    const { action, notes } = await request.json() // action: 'approve', 'reject', 'process'

    if (!['approve', 'reject', 'process'].includes(action)) {
      return apiBadRequest('Invalid action. Must be approve, reject, or process')
    }

    // Get refund details
    const refundResult = await query(`
      SELECT
        r.*,
        pt.provider_transaction_id,
        pt.currency,
        pt.provider_id,
        pp.slug as provider_slug
      FROM ${TABLE_NAMES.REFUNDS} r
      JOIN ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt ON r.original_transaction_id = pt.id
      JOIN ${TABLE_NAMES.PAYMENT_PROVIDERS} pp ON pt.provider_id = pp.id
      WHERE r.id = $1
    `, [refundId])

    if (refundResult.rows.length === 0) {
      return apiNotFound('Refund not found')
    }

    const refund = refundResult.rows[0]

    // Handle different actions
    if (action === 'approve') {
      if (refund.status !== 'requested') {
        return apiBadRequest('Refund is not in requested status')
      }

      // Approve the refund
      await query(`
        UPDATE ${TABLE_NAMES.REFUNDS}
        SET
          status = 'approved',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          internal_notes = COALESCE(internal_notes, '') || $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        session.user.id,
        notes ? `\n[${new Date().toISOString()}] Approved by admin: ${notes}` : '',
        refundId
      ])

    } else if (action === 'reject') {
      if (!['requested', 'approved'].includes(refund.status)) {
        return apiBadRequest('Refund cannot be rejected in current status')
      }

      // Reject the refund
      await query(`
        UPDATE ${TABLE_NAMES.REFUNDS}
        SET
          status = 'rejected',
          processed_by = $1,
          processed_at = CURRENT_TIMESTAMP,
          internal_notes = COALESCE(internal_notes, '') || $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        session.user.id,
        notes ? `\n[${new Date().toISOString()}] Rejected by admin: ${notes}` : '',
        refundId
      ])

    } else if (action === 'process') {
      if (refund.status !== 'approved') {
        return apiBadRequest('Refund must be approved before processing')
      }

      try {
        // Process refund with Stripe
        const stripe = getStripeClient()
        if (!stripe) {
          return apiError('Stripe is not configured', 500)
        }
        
        const stripeRefund = await stripe.refunds.create({
          payment_intent: refund.provider_transaction_id,
          amount: refund.amount_cents,
          reason: mapRefundReason(refund.reason),
          metadata: {
            refundId: refundId.toString(),
            refundNumber: refund.refund_number,
            originalTransactionId: refund.original_transaction_id.toString(),
            processedBy: session.user.id
          }
        })

        // Update refund with Stripe refund ID
        await query(`
          UPDATE ${TABLE_NAMES.REFUNDS}
          SET
            refund_transaction_id = $1,
            status = 'processing',
            processed_by = $2,
            processed_at = CURRENT_TIMESTAMP,
            internal_notes = COALESCE(internal_notes, '') || $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [
          stripeRefund.id,
          session.user.id,
          `\n[${new Date().toISOString()}] Processed via Stripe: ${stripeRefund.id}`,
          refundId
        ])

        // Create refund transaction record
        await query(`
          INSERT INTO ${TABLE_NAMES.PAYMENT_TRANSACTIONS} (
            user_id,
            provider_id,
            provider_transaction_id,
            type,
            status,
            amount_cents,
            currency,
            description,
            provider_response
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
        `, [
          refund.requested_by,
          refund.provider_id,
          stripeRefund.id,
          'refund',
          'processing',
          refund.amount_cents,
          refund.currency,
          `Refund for transaction ${refund.provider_transaction_id}`,
          JSON.stringify(stripeRefund)
        ])

      } catch (stripeError: unknown) {
        logger.error('Stripe refund processing error', { error: stripeError })
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'

        // Mark refund as rejected due to processing error
        await query(`
          UPDATE ${TABLE_NAMES.REFUNDS}
          SET
            status = 'rejected',
            processed_by = $1,
            processed_at = CURRENT_TIMESTAMP,
            internal_notes = COALESCE(internal_notes, '') || $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [
          session.user.id,
          `\n[${new Date().toISOString()}] Processing failed: ${errorMessage}`,
          refundId
        ])

        return apiError(stripeError, 'Refund processing failed')
      }
    }

    // Get updated refund
    const updatedResult = await query(`
      SELECT
        r.*,
        u.name as customer_name,
        u.email as customer_email
      FROM ${TABLE_NAMES.REFUNDS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requested_by = u.id
      WHERE r.id = $1
    `, [refundId])

    return apiSuccess({
      refund: updatedResult.rows[0],
      message: `Refund ${action}d successfully`
    })

  } catch (error) {
    logger.error('Admin refund action error', { error })
    return apiError(error, 'Failed to process refund action')
  }
}

// Helper function to map our refund reasons to Stripe's format
function mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
  switch (reason) {
    case 'customer_request':
      return 'requested_by_customer'
    case 'service_cancelled':
    case 'service_not_completed':
      return 'duplicate' // Stripe doesn't have a perfect match
    case 'fraud':
      return 'fraudulent'
    default:
      return 'requested_by_customer'
  }
}