import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, EscrowReleaseSchema } from '@/lib/schemas'

interface EscrowRow {
  id: string
  transaction_id: string
  buyer_id: string
  seller_id: string | null
  total_amount_cents: number
  held_amount_cents: number
  released_amount_cents: number
  currency: string
  status: string
  auto_release_days: number
  release_deadline: string
  created_at: string
  released_at: string | null
  provider_transaction_id: string
  transaction_amount: number
  buyer_name: string
  buyer_email: string
  seller_name: string | null
  seller_email: string | null
  releases: Array<{
    id: string
    amount_cents: number
    release_type: string
    reason: string
    released_at: string
    released_by: string
  }> | null
}

// Simpler escrow row for release operations
interface EscrowReleaseRow {
  id: string
  transaction_id: string
  buyer_id: string
  seller_id: string | null
  total_amount_cents: number
  released_amount_cents: number
  currency: string
  status: string
  provider_id: string
  provider_transaction_id: string
  transaction_amount: number
}

// GET /api/payments/escrow/[id] - Get escrow account details
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: escrowId } = context!.params!

    // Get escrow account details
    const escrowResult = await query(`
      SELECT
        ea.*,
        pt.provider_transaction_id,
        pt.amount_cents as transaction_amount,
        pt.currency,
        b.name as buyer_name,
        b.email as buyer_email,
        s.name as seller_name,
        s.email as seller_email,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', er.id,
            'amount_cents', er.amount_cents,
            'release_type', er.release_type,
            'reason', er.reason,
            'released_at', er.released_at,
            'released_by', er.released_by
          )
        ) FILTER (WHERE er.id IS NOT NULL) as releases
      FROM ${TABLE_NAMES.ESCROW_ACCOUNTS} ea
      JOIN ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt ON ea.transaction_id = pt.id
      JOIN ${TABLE_NAMES.USERS} b ON ea.buyer_id = b.id
      LEFT JOIN ${TABLE_NAMES.USERS} s ON ea.seller_id = s.id
      LEFT JOIN ${TABLE_NAMES.ESCROW_RELEASES} er ON ea.id = er.escrow_account_id
      WHERE ea.id = $1
      GROUP BY ea.id, pt.provider_transaction_id, pt.amount_cents, pt.currency, b.name, b.email, s.name, s.email
    `, [escrowId])

    if (escrowResult.rows.length === 0) {
      return apiNotFound('Treuhandkonto nicht gefunden')
    }

    const escrow = escrowResult.rows[0] as EscrowRow

    // Check permissions - buyer, seller, or admin can view
    const isAdmin = session.user.isStaff

    if (escrow.buyer_id !== session.user.id && escrow.seller_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Keine Berechtigung, dieses Treuhandkonto einzusehen')
    }

    return apiSuccess({
      escrow: {
        id: escrow.id,
        totalAmount: escrow.total_amount_cents / 100,
        currency: escrow.currency,
        heldAmount: escrow.held_amount_cents / 100,
        releasedAmount: escrow.released_amount_cents / 100,
        status: escrow.status,
        autoReleaseDays: escrow.auto_release_days,
        releaseDeadline: escrow.release_deadline,
        createdAt: escrow.created_at,
        releasedAt: escrow.released_at,
        buyer: {
          id: escrow.buyer_id,
          name: escrow.buyer_name,
          email: escrow.buyer_email
        },
        seller: escrow.seller_id ? {
          id: escrow.seller_id,
          name: escrow.seller_name,
          email: escrow.seller_email
        } : null,
        transactionId: escrow.provider_transaction_id,
        releases: escrow.releases || []
      }
    })
  } catch (error) {
    logger.error('Get escrow error', { error })
    return apiError(error, 'Treuhandkonto konnte nicht abgerufen werden')
  }
})

// POST /api/payments/escrow/[id]/release - Release escrow funds
export const POST = withAuth<{ id: string }>(async (request, session, context) => {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const { id: escrowId } = context!.params!
    const body = await request.json()
    const validation = validateBody(EscrowReleaseSchema, body)
    if (!validation.success) return validation.error
    const { amount, reason, releaseType } = validation.data

    // Get escrow account
    const escrowResult = await query(`
      SELECT
        ea.*,
        pt.provider_transaction_id,
        pt.amount_cents as transaction_amount,
        pt.currency
      FROM ${TABLE_NAMES.ESCROW_ACCOUNTS} ea
      JOIN ${TABLE_NAMES.PAYMENT_TRANSACTIONS} pt ON ea.transaction_id = pt.id
      WHERE ea.id = $1 AND ea.status = 'active'
    `, [escrowId])

    if (escrowResult.rows.length === 0) {
      return apiNotFound('Aktives Treuhandkonto nicht gefunden')
    }

    const escrow = escrowResult.rows[0] as EscrowReleaseRow

    // Check permissions - only buyer or admin can release funds
    const isAdmin = session.user.isStaff

    if (escrow.buyer_id !== session.user.id && !isAdmin) {
      return apiUnauthorized('Nur der Käufer kann Treuhandgelder freigeben')
    }

    const releaseAmountCents = Math.round(amount * 100)
    const availableAmount = escrow.total_amount_cents - escrow.released_amount_cents

    if (releaseAmountCents > availableAmount) {
      return apiBadRequest(`Freigabebetrag übersteigt verfügbares Guthaben. Maximum: ${(availableAmount / 100).toFixed(2)} ${escrow.currency}`)
    }

    // Determine if this is a full release
    const isFullRelease = releaseType === 'full' || releaseAmountCents >= availableAmount

    try {
      if (isFullRelease) {
        // Capture the full payment with Stripe
        await stripe.paymentIntents.capture(escrow.provider_transaction_id, {
          amount_to_capture: escrow.total_amount_cents - escrow.released_amount_cents
        })

        // Update escrow status to released
        await query(`
          UPDATE ${TABLE_NAMES.ESCROW_ACCOUNTS}
          SET
            status = 'released',
            released_amount_cents = total_amount_cents,
            released_at = CURRENT_TIMESTAMP,
            release_notes = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [reason || 'Funds released by buyer', escrowId])

      } else {
        // Partial release - capture partial amount
        await stripe.paymentIntents.capture(escrow.provider_transaction_id, {
          amount_to_capture: releaseAmountCents
        })

        // Update escrow released amount
        await query(`
          UPDATE ${TABLE_NAMES.ESCROW_ACCOUNTS}
          SET
            released_amount_cents = released_amount_cents + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [releaseAmountCents, escrowId])
      }

      // Create escrow release record
      await query(`
        INSERT INTO ${TABLE_NAMES.ESCROW_RELEASES} (
          escrow_account_id,
          transaction_id,
          amount_cents,
          release_type,
          reason,
          released_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
      `, [
        escrowId,
        escrow.transaction_id,
        releaseAmountCents,
        isFullRelease ? 'full' : 'partial',
        reason || 'Released by buyer',
        session.user.id
      ])

      // Create payment transaction record for the release
      const releaseTransaction = await query(`
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
        RETURNING id
      `, [
        escrow.seller_id || escrow.buyer_id, // Pay to seller if exists, otherwise refund to buyer
        escrow.provider_id,
        `release_${escrow.provider_transaction_id}_${Date.now()}`,
        'transfer',
        'succeeded',
        releaseAmountCents,
        escrow.currency,
        `Escrow release: ${reason || 'Released by buyer'}`,
      ])

      return apiSuccess({
        message: isFullRelease ? 'Treuhandgelder vollständig freigegeben' : 'Treuhandgelder teilweise freigegeben',
        releasedAmount: releaseAmountCents / 100,
        currency: escrow.currency,
        remainingBalance: (availableAmount - releaseAmountCents) / 100
      })
    } catch (stripeError: unknown) {
      logger.error('Stripe capture error', { error: stripeError })
      return apiError(stripeError, 'Treuhandgelder konnten nicht freigegeben werden')
    }

  } catch (error) {
    logger.error('Escrow release error', { error })
    return apiError(error, 'Treuhandgelder konnten nicht freigegeben werden')
  }
})