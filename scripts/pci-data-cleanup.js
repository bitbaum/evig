#!/usr/bin/env node

/**
 * PCI DSS Data Cleanup Script
 * Removes or anonymizes sensitive payment data after retention periods
 * Runs periodically to maintain PCI compliance
 */

const { Client } = require('pg')
const { cleanupExpiredData, PCI_COMPLIANCE, maskSensitiveData } = require('../src/lib/payments/security')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'revampit_cms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
}

async function cleanupPCIData() {
  const client = new Client(dbConfig)

  try {
    await client.connect()
    console.log('Connected to database for PCI cleanup')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - PCI_COMPLIANCE.DATA_RETENTION.CARD_DATA_MAX_DAYS)

    console.log(`Cleaning up payment data older than ${cutoffDate.toISOString()}`)

    // 1. Anonymize old payment transaction metadata
    console.log('Step 1: Anonymizing old transaction metadata...')

    const anonymizeResult = await client.query(`
      UPDATE payment_transactions
      SET metadata = jsonb_build_object(
        'anonymized', true,
        'anonymized_at', $2,
        'original_amount', (metadata->>'subtotalCents')::int / 100.0,
        'original_currency', currency
      )
      WHERE created_at < $1
        AND (metadata->>'anonymized') IS NULL
        AND type = 'payment'
    `, [cutoffDate, new Date().toISOString()])

    console.log(`✓ Anonymized ${anonymizeResult.rowCount} transaction records`)

    // 2. Clean up old webhook logs (keep only essential info)
    console.log('Step 2: Cleaning webhook response data...')

    const webhookCleanupResult = await client.query(`
      UPDATE payment_transactions
      SET provider_response = jsonb_build_object(
        'event_type', provider_response->'type',
        'processed_at', provider_response->'created',
        'status', provider_response->'status',
        'anonymized', true
      )
      WHERE created_at < $1
        AND jsonb_typeof(provider_response) = 'object'
        AND (provider_response->>'anonymized') IS NULL
    `, [cutoffDate])

    console.log(`✓ Cleaned ${webhookCleanupResult.rowCount} webhook records`)

    // 3. Archive old refund data (move to archive table)
    console.log('Step 3: Archiving old refund data...')

    // Create archive table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS archived_refunds (
        LIKE refunds INCLUDING ALL,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const archiveResult = await client.query(`
      WITH moved_rows AS (
        DELETE FROM refunds
        WHERE created_at < $1
          AND status IN ('completed', 'rejected')
        RETURNING *
      )
      INSERT INTO archived_refunds
      SELECT *, CURRENT_TIMESTAMP FROM moved_rows
    `, [cutoffDate])

    console.log(`✓ Archived ${archiveResult.rowCount} old refund records`)

    // 4. Clean up old payment analytics (keep summary data only)
    console.log('Step 4: Cleaning payment analytics...')

    const analyticsCutoff = new Date()
    analyticsCutoff.setMonth(analyticsCutoff.getMonth() - 6) // Keep 6 months of detailed analytics

    const analyticsCleanupResult = await client.query(`
      UPDATE payment_analytics
      SET type_breakdown = jsonb_build_object(
        'total_processed', (type_breakdown->>'payment')::int + (type_breakdown->>'refund')::int,
        'anonymized', true
      )
      WHERE date < $1
        AND (type_breakdown->>'anonymized') IS NULL
    `, [analyticsCutoff])

    console.log(`✓ Cleaned ${analyticsCleanupResult.rowCount} analytics records`)

    // 5. Remove old temporary data (in-memory cleanup simulation)
    console.log('Step 5: Simulating in-memory cleanup...')

    const memoryCleanup = await cleanupExpiredData()
    console.log(`✓ Memory cleanup completed:`, memoryCleanup)

    // 6. Generate compliance report
    console.log('Step 6: Generating compliance report...')

    const complianceReport = await client.query(`
      SELECT
        'transactions_anonymized' as metric,
        COUNT(*) as value
      FROM payment_transactions
      WHERE metadata->>'anonymized' = 'true'
      UNION ALL
      SELECT
        'active_escrow_accounts' as metric,
        COUNT(*) as value
      FROM escrow_accounts
      WHERE status = 'active'
      UNION ALL
      SELECT
        'pending_refunds' as metric,
        COUNT(*) as value
      FROM refunds
      WHERE status IN ('requested', 'approved')
      UNION ALL
      SELECT
        'total_payment_volume_30d' as metric,
        COALESCE(SUM(amount_cents), 0) / 100 as value
      FROM payment_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'succeeded'
        AND type = 'payment'
    `)

    console.log('📊 PCI Compliance Report:')
    complianceReport.rows.forEach(row => {
      console.log(`  ${row.metric}: ${row.value}`)
    })

    console.log('\n✅ PCI DSS data cleanup completed successfully')

  } catch (error) {
    console.error('PCI cleanup script error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  cleanupPCIData()
    .then(() => {
      console.log('PCI data cleanup script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('PCI data cleanup script failed:', error)
      process.exit(1)
    })
}

module.exports = { cleanupPCIData }