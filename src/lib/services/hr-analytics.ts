/**
 * HR funnel analytics — admin stats
 */

import { db } from '@/db'
import { jobApplications, jobPostings } from '@/db/schema/hr-vacancies'
import { eq, sql, count } from 'drizzle-orm'
import { VACANCY_STATUS } from '@/config/hr-vacancies'
import { APPLICATION_STATUS } from '@/config/hr-application-status'
import type { HrFunnelStats } from '@/components/admin/hr/types'

export async function getHrFunnelStats(): Promise<HrFunnelStats> {
  const [statusRows, trackRows, sourceRows, publishedRow, pendingRow] = await Promise.all([
    db
      .select({ status: jobApplications.status, cnt: count() })
      .from(jobApplications)
      .groupBy(jobApplications.status),
    db
      .select({ track: jobPostings.roleTrack, cnt: count() })
      .from(jobApplications)
      .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
      .groupBy(jobPostings.roleTrack),
    db
      .select({ source: jobApplications.source, cnt: count() })
      .from(jobApplications)
      .groupBy(jobApplications.source),
    db
      .select({ cnt: count() })
      .from(jobPostings)
      .where(eq(jobPostings.status, VACANCY_STATUS.PUBLISHED)),
    db
      .select({ cnt: count() })
      .from(jobApplications)
      .where(eq(jobApplications.status, APPLICATION_STATUS.NEW)),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of statusRows) byStatus[row.status] = Number(row.cnt)

  const byTrack: Record<string, number> = {}
  for (const row of trackRows) byTrack[row.track] = Number(row.cnt)

  const bySource: Record<string, number> = {}
  for (const row of sourceRows) bySource[row.source] = Number(row.cnt)

  return {
    byStatus,
    byTrack,
    bySource,
    publishedVacancies: Number(publishedRow[0]?.cnt ?? 0),
    pendingApplications: Number(pendingRow[0]?.cnt ?? 0),
  }
}
