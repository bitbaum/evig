/**
 * Archive HR job applications past retention window.
 * Run via cron or manually: npx tsx scripts/maintenance/hr-application-retention.ts
 */

import { archiveStaleApplications } from '@/lib/services/hr-retention'
import { logger } from '@/lib/logger'

async function main() {
  const count = await archiveStaleApplications()
  logger.info('HR retention job complete', { archived: count })
  process.exit(0)
}

main().catch((error) => {
  logger.error('HR retention job failed', { error })
  process.exit(1)
})
