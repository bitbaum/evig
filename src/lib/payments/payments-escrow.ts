/**
 * Escrow Operations
 *
 * Database operations for creating and managing escrow accounts
 * associated with payment transactions.
 */

import { db } from '@/db'
import { escrowAccounts } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import type { SupportedCurrency } from '@/lib/payments/currency'

// ============================================================================
// Types
// ============================================================================

export interface EscrowParams {
  transactionId: string
  totalAmountCents: number
  currency: SupportedCurrency
  autoReleaseDays: number
  buyerId: string
}

// ============================================================================
// Escrow Operations
// ============================================================================

/**
 * Create an escrow account for a transaction
 */
export async function createEscrowAccount(params: EscrowParams): Promise<void> {
  await db
    .insert(escrowAccounts)
    .values({
      transactionId: params.transactionId,
      totalAmountCents: params.totalAmountCents,
      currency: params.currency,
      autoReleaseDays: params.autoReleaseDays,
      releaseDeadline: sql`CURRENT_TIMESTAMP + INTERVAL '1 day' * ${params.autoReleaseDays}`,
      buyerId: params.buyerId,
      status: 'active',
    })

  logger.info('Escrow account created', {
    transactionId: params.transactionId,
    amount: params.totalAmountCents,
    autoReleaseDays: params.autoReleaseDays
  })
}
