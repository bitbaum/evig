import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { db } from '@/db'
import { escrowAccounts, escrowReleases, paymentTransactions, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { PAYMENT_STATUS, ESCROW_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'
import { validateBody, EscrowReleaseSchema } from '@/lib/schemas'

interface EscrowRow {
  [key: string]: unknown
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

// GET /api/payments/escrow/[id] - Get escrow account details
export const GET = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    const { id: escrowId } = context!.params!

    // Complex query with ARRAY_AGG — use raw SQL via Drizzle sql template
    const escrowResult = await db.execute<EscrowRow>(sql`
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
      FROM ${escrowAccounts} ea
      JOIN ${paymentTransactions} pt ON ea.transaction_id = pt.id
      JOIN ${users} b ON ea.buyer_id = b.id
      LEFT JOIN ${users} s ON ea.seller_id = s.id
      LEFT JOIN ${escrowReleases} er ON ea.id = er.escrow_account_id
      WHERE ea.id = ${escrowId}
      GROUP BY ea.id, pt.provider_transaction_id, pt.amount_cents, pt.currency, b.name, b.email, s.name, s.email
    `)

    if (escrowResult.rows.length === 0) {
      return apiNotFound('Treuhandkonto nicht gefunden')
    }

    const escrow = escrowResult.rows[0]

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

// Simpler escrow row for release operations
interface EscrowReleaseRow {
  id: string
  transactionId: string
  buyerId: string
  sellerId: string | null
  totalAmountCents: number
  releasedAmountCents: number
  currency: string
  status: string
  providerId: string
  providerTransactionId: string
  transactionAmount: number
}

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

    // Get escrow account with transaction details
    const escrowRows = await db
      .select({
        id: escrowAccounts.id,
        transactionId: escrowAccounts.transactionId,
        buyerId: escrowAccounts.buyerId,
        sellerId: escrowAccounts.sellerId,
        totalAmountCents: escrowAccounts.totalAmountCents,
        releasedAmountCents: escrowAccounts.releasedAmountCents,
        currency: escrowAccounts.currency,
        status: escrowAccounts.status,
        providerId: paymentTransactions.providerId,
        providerTransactionId: paymentTransactions.providerTransactionId,
        transactionAmount: paymentTransactions.amountCents,
      })
      .from(escrowAccounts)
      .innerJoin(paymentTransactions, eq(escrowAccounts.transactionId, paymentTransactions.id))
      .where(
        and(
          eq(escrowAccounts.id, escrowId),
          eq(escrowAccounts.status, ESCROW_STATUS.ACTIVE)
        )
      )

    if (escrowRows.length === 0) {
      return apiNotFound('Aktives Treuhandkonto nicht gefunden')
    }

    const escrow = escrowRows[0] as EscrowReleaseRow

    // Check permissions - only buyer or admin can release funds
    const isAdmin = session.user.isStaff

    if (escrow.buyerId !== session.user.id && !isAdmin) {
      return apiUnauthorized('Nur der Käufer kann Treuhandgelder freigeben')
    }

    const releaseAmountCents = Math.round(amount * 100)
    const availableAmount = escrow.totalAmountCents - escrow.releasedAmountCents

    if (releaseAmountCents > availableAmount) {
      return apiBadRequest(`Freigabebetrag übersteigt verfügbares Guthaben. Maximum: ${(availableAmount / 100).toFixed(2)} ${escrow.currency}`)
    }

    // Determine if this is a full release
    const isFullRelease = releaseType === 'full' || releaseAmountCents >= availableAmount

    try {
      if (isFullRelease) {
        // Capture the full payment with Stripe
        await stripe.paymentIntents.capture(escrow.providerTransactionId!, {
          amount_to_capture: escrow.totalAmountCents - escrow.releasedAmountCents
        })

        // Update escrow status to released
        await db
          .update(escrowAccounts)
          .set({
            status: ESCROW_STATUS.RELEASED,
            releasedAmountCents: sql`${escrowAccounts.totalAmountCents}`,
            releasedAt: sql`CURRENT_TIMESTAMP`,
            releaseNotes: reason || 'Funds released by buyer',
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(escrowAccounts.id, escrowId))

      } else {
        // Partial release - capture partial amount
        await stripe.paymentIntents.capture(escrow.providerTransactionId!, {
          amount_to_capture: releaseAmountCents
        })

        // Update escrow released amount
        await db
          .update(escrowAccounts)
          .set({
            releasedAmountCents: sql`${escrowAccounts.releasedAmountCents} + ${releaseAmountCents}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(escrowAccounts.id, escrowId))
      }

      // Create escrow release record
      await db
        .insert(escrowReleases)
        .values({
          escrowAccountId: escrowId,
          transactionId: escrow.transactionId,
          amountCents: releaseAmountCents,
          releaseType: isFullRelease ? 'full' : 'partial',
          reason: reason || 'Released by buyer',
          releasedBy: session.user.id,
        })

      // Create payment transaction record for the release
      await db
        .insert(paymentTransactions)
        .values({
          userId: escrow.sellerId || escrow.buyerId,
          providerId: escrow.providerId,
          providerTransactionId: `release_${escrow.providerTransactionId}_${Date.now()}`,
          type: 'transfer',
          status: PAYMENT_STATUS.SUCCEEDED,
          amountCents: releaseAmountCents,
          currency: escrow.currency,
          description: `Escrow release: ${reason || 'Released by buyer'}`,
        })

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
