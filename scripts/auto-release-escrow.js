#!/usr/bin/env node

/**
 * Auto-release escrow funds that have passed their deadline
 * This script should be run periodically (e.g., daily) via cron job
 */

const { Client } = require('pg')
const Stripe = require('stripe')

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'revampit_cms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
}

async function autoReleaseEscrow() {
  const client = new Client(dbConfig)

  try {
    await client.connect()
    console.log('Connected to database')

    // Find escrow accounts that are past their release deadline and still active
    const expiredEscrowResult = await client.query(`
      SELECT
        ea.*,
        pt.provider_transaction_id,
        pt.amount_cents as transaction_amount,
        pt.currency,
        b.email as buyer_email,
        s.email as seller_email
      FROM escrow_accounts ea
      JOIN payment_transactions pt ON ea.transaction_id = pt.id
      JOIN users b ON ea.buyer_id = b.id
      LEFT JOIN users s ON ea.seller_id = s.id
      WHERE ea.status = 'active'
        AND ea.release_deadline < CURRENT_TIMESTAMP
        AND (ea.total_amount_cents - ea.released_amount_cents) > 0
    `)

    const expiredEscrows = expiredEscrowResult.rows
    console.log(`Found ${expiredEscrows.length} expired escrow accounts to process`)

    for (const escrow of expiredEscrows) {
      try {
        console.log(`Processing escrow ${escrow.id} for transaction ${escrow.provider_transaction_id}`)

        const remainingAmount = escrow.total_amount_cents - escrow.released_amount_cents

        // Capture remaining funds with Stripe
        await stripe.paymentIntents.capture(escrow.provider_transaction_id, {
          amount_to_capture: remainingAmount
        })

        // Update escrow status
        await client.query(`
          UPDATE escrow_accounts
          SET
            status = 'released',
            released_amount_cents = total_amount_cents,
            released_at = CURRENT_TIMESTAMP,
            release_notes = 'Auto-released after deadline',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [escrow.id])

        // Create escrow release record
        await client.query(`
          INSERT INTO escrow_releases (
            escrow_account_id,
            transaction_id,
            amount_cents,
            release_type,
            reason,
            released_by
          ) VALUES (
            $1, $2, $3, $4, $5,
            (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
          )
        `, [
          escrow.id,
          escrow.transaction_id,
          remainingAmount,
          'full',
          'Auto-released after deadline'
        ])

        // Create payment transaction record for the auto-release
        await client.query(`
          INSERT INTO payment_transactions (
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
          escrow.seller_id || escrow.buyer_id, // Pay to seller if exists, otherwise to buyer
          escrow.provider_id,
          `auto_release_${escrow.provider_transaction_id}_${Date.now()}`,
          'transfer',
          'succeeded',
          remainingAmount,
          escrow.currency,
          'Auto-release of escrow funds after deadline',
          JSON.stringify({ escrowId: escrow.id, autoReleased: true })
        ])

        console.log(`✓ Auto-released escrow ${escrow.id}: ${remainingAmount / 100} ${escrow.currency}`)

        // TODO: Send notification emails to buyer and seller about auto-release

      } catch (error) {
        console.error(`✗ Failed to auto-release escrow ${escrow.id}:`, error)

        // Log the error but continue with other escrows
        await client.query(`
          INSERT INTO payment_analytics (
            date,
            provider_id,
            type_breakdown
          ) VALUES (
            CURRENT_DATE,
            $1,
            $2
          )
          ON CONFLICT (date, provider_id) DO UPDATE SET
            type_breakdown = jsonb_set(
              COALESCE(payment_analytics.type_breakdown, '{}'),
              '{auto_release_error}',
              (COALESCE(payment_analytics.type_breakdown->>'auto_release_error', '0')::integer + 1)::text::jsonb
            )
        `, [escrow.provider_id, JSON.stringify({ auto_release_error: 1 })])
      }
    }

    console.log(`Processed ${expiredEscrows.length} escrow accounts`)

  } catch (error) {
    console.error('Auto-release escrow script error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  autoReleaseEscrow()
    .then(() => {
      console.log('Auto-release escrow script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Auto-release escrow script failed:', error)
      process.exit(1)
    })
}

module.exports = { autoReleaseEscrow }