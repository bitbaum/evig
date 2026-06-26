/**
 * HR application retention — close stale open applications after policy window.
 */

import { db } from '@/db'
import { jobApplications } from '@/db/schema/hr-vacancies'
import { and, inArray, lt } from 'drizzle-orm'
import { APPLICATION_STATUS, OPEN_APPLICATION_STATUSES } from '@/config/hr-application-status'
import { HR_APPLICATION_RETENTION_DAYS } from '@/config/hr-vacancies'
import { logger } from '@/lib/logger'

const OPEN_STATUSES = OPEN_APPLICATION_STATUSES

const ARCHIVE_REASON = 'Automatisch archiviert (Aufbewahrungsfrist abgelaufen)'

export async function archiveStaleApplications(): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - HR_APPLICATION_RETENTION_DAYS)
  const cutoffIso = cutoff.toISOString()

  const result = await db
    .update(jobApplications)
    .set({
      status: APPLICATION_STATUS.REJECTED,
      rejectionReason: ARCHIVE_REASON,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        inArray(jobApplications.status, [...OPEN_STATUSES]),
        lt(jobApplications.createdAt, cutoffIso),
      ),
    )
    .returning({ id: jobApplications.id })

  const count = result.length
  if (count > 0) {
    logger.info('HR applications archived by retention policy', { count, cutoffIso })
  }
  return count
}
