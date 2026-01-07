#!/usr/bin/env node

/**
 * Auto-process refunds based on business rules
 * This script should be run periodically to handle automatic refunds
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

// Auto-refund rules
const AUTO_REFUND_RULES = [
  {
    name: 'Service Cancellation',
    condition: `
      sa.status = 'cancelled'
      AND sa.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM payment_transactions pt
        WHERE pt.service_appointment_id = sa.id
        AND pt.type = 'refund'
        AND pt.status IN ('succeeded', 'processing')
      )
    `,
    refundType: 'service_cancelled',
    refundPercentage: 1.0, // 100% refund
    reason: 'Service cancelled by customer within 24 hours'
  },
  {
    name: 'No Show Refund',
    condition: `
      sa.status = 'no_show'
      AND sa.scheduled_date < CURRENT_TIMESTAMP - INTERVAL '1 hour'
      AND NOT EXISTS (
        SELECT 1 FROM payment_transactions pt
        WHERE pt.service_appointment_id = sa.id
        AND pt.type = 'refund'
        AND pt.status IN ('succeeded', 'processing')
      )
    `,
    refundType: 'service_not_completed',
    refundPercentage: 0.5, // 50% refund for no-shows
    reason: 'Customer did not show up for appointment'
  },
  {
    name: 'Workshop Cancellation',
    condition: `
      wr.status = 'cancelled'
      AND wr.created_at > CURRENT_TIMESTAMP - INTERVAL '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM payment_transactions pt
        WHERE pt.workshop_registration_id = wr.id
        AND pt.type = 'refund'
        AND pt.status IN ('succeeded', 'processing')
      )
    `,
    refundType: 'service_cancelled',
    refundPercentage: 1.0, // 100% refund
    reason: 'Workshop cancelled within 48 hours'
  }
]

async function autoProcessRefunds() {
  const client = new Client(dbConfig)

  try {
    await client.connect()
    console.log('Connected to database')

    let totalProcessed = 0

    for (const rule of AUTO_REFUND_RULES) {
      console.log(`\nProcessing rule: ${rule.name}`)

      // Find eligible transactions for auto-refund
      const eligibleTransactions = await client.query(`
        SELECT
          pt.*,
          u.name as customer_name,
          u.email as customer_email,
          sa.status as appointment_status,
          sa.id as appointment_id,
          wr.status as registration_status,
          wr.id as registration_id
        FROM payment_transactions pt
        JOIN users u ON pt.user_id = u.id
        LEFT JOIN service_appointments sa ON pt.service_appointment_id = sa.id
        LEFT JOIN workshop_registrations wr ON pt.workshop_registration_id = wr.id
        WHERE pt.type = 'payment'
          AND pt.status = 'succeeded'
          AND (${rule.condition})
      `)

      console.log(`Found ${eligibleTransactions.rows.length} eligible transactions`)

      for (const transaction of eligibleTransactions.rows) {
        try {
          console.log(`Processing auto-refund for transaction ${transaction.id}`)

          // Calculate refund amount
          const refundAmount = Math.round(transaction.amount_cents * rule.refundPercentage)

          // Check if refund already exists
          const existingRefund = await client.query(
            'SELECT id FROM refunds WHERE original_transaction_id = $1 AND status IN (\'requested\', \'approved\', \'processing\', \'completed\')',
            [transaction.id]
          )

          if (existingRefund.rows.length > 0) {
            console.log(`Refund already exists for transaction ${transaction.id}`)
            continue
          }

          // Create auto-refund record
          const refundResult = await client.query(`
            INSERT INTO refunds (
              refund_number,
              original_transaction_id,
              amount_cents,
              currency,
              reason,
              reason_details,
              requested_by,
              status,
              approved_by,
              approved_at,
              processed_by,
              processed_at
            ) VALUES (
              generate_refund_number(),
              $1, $2, $3, $4, $5, $6, $7,
              (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
              CURRENT_TIMESTAMP,
              (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
              CURRENT_TIMESTAMP
            )
            RETURNING id, refund_number
          `, [
            transaction.id,
            refundAmount,
            transaction.currency,
            rule.refundType,
            rule.reason,
            transaction.user_id,
            'approved' // Auto-approve for system refunds
          ])

          const refundId = refundResult.rows[0].id
          const refundNumber = refundResult.rows[0].refund_number

          // Process refund immediately with Stripe
          const stripeRefund = await stripe.refunds.create({
            payment_intent: transaction.provider_transaction_id,
            amount: refundAmount,
            reason: mapRefundReason(rule.refundType),
            metadata: {
              refundId: refundId.toString(),
              refundNumber,
              originalTransactionId: transaction.id.toString(),
              autoProcessed: 'true',
              ruleName: rule.name
            }
          })

          // Update refund with Stripe refund ID
          await client.query(`
            UPDATE refunds
            SET
              refund_transaction_id = $1,
              status = 'processing',
              internal_notes = $2
            WHERE id = $3
          `, [
            stripeRefund.id,
            `Auto-processed by rule: ${rule.name}`,
            refundId
          ])

          // Create refund transaction record
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
              provider_response,
              metadata
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
          `, [
            transaction.user_id,
            transaction.provider_id,
            stripeRefund.id,
            'refund',
            'processing',
            refundAmount,
            transaction.currency,
            `Auto-refund: ${rule.reason}`,
            JSON.stringify(stripeRefund),
            JSON.stringify({ autoProcessed: true, ruleName: rule.name })
          ])

          console.log(`✓ Auto-refund processed: ${refundNumber} for ${refundAmount / 100} ${transaction.currency}`)
          totalProcessed++

        } catch (error) {
          console.error(`✗ Failed to auto-process refund for transaction ${transaction.id}:`, error)

          // Log the error
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
                '{auto_refund_error}',
                (COALESCE(payment_analytics.type_breakdown->>'auto_refund_error', '0')::integer + 1)::text::jsonb
              )
          `, [transaction.provider_id, JSON.stringify({ auto_refund_error: 1 })])
        }
      }
    }

    console.log(`\nAuto-refund processing completed. Processed ${totalProcessed} refunds.`)

  } catch (error) {
    console.error('Auto-refund processing script error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

// Helper function to map refund reasons to Stripe format
function mapRefundReason(reason) {
  switch (reason) {
    case 'customer_request':
      return 'requested_by_customer'
    case 'service_cancelled':
    case 'service_not_completed':
      return 'duplicate'
    case 'fraud':
      return 'fraudulent'
    default:
      return 'requested_by_customer'
  }
}

// Run the script
if (require.main === module) {
  autoProcessRefunds()
    .then(() => {
      console.log('Auto-refund processing script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Auto-refund processing script failed:', error)
      process.exit(1)
    })
}

module.exports = { autoProcessRefunds }