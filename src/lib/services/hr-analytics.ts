/**
 * HR funnel analytics — admin stats
 */

import { db } from '@/db'
import { jobApplications, jobPostings } from '@/db/schema/hr-vacancies'
import { eq, count } from 'drizzle-orm'
import { VACANCY_STATUS } from '@/config/hr-vacancies'
import { APPLICATION_STATUS } from '@/config/hr-application-status'
import type { HrFunnelStats } from '@/lib/types/hr'

export type { HrFunnelStats } from '@/lib/types/hr'

export async function getHrFunnelStats(): Promise<HrFunnelStats> {
  const [
    statusRows,
    trackRows,
    sourceRows,
    publishedRow,
    pendingRow,
    draftVacanciesRow,
    filledVacanciesRow,
  ] = await Promise.all([
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
    db
      .select({ cnt: count() })
      .from(jobPostings)
      .where(eq(jobPostings.status, VACANCY_STATUS.DRAFT)),
    db
      .select({ cnt: count() })
      .from(jobPostings)
      .where(eq(jobPostings.status, VACANCY_STATUS.FILLED)),
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
    draftVacancies: Number(draftVacanciesRow[0]?.cnt ?? 0),
    filledVacancies: Number(filledVacanciesRow[0]?.cnt ?? 0),
  }
}

export async function countSubmittedTimecardsPendingReview(): Promise<number> {
  const { timecards } = await import('@/db/schema/timecards')
  const { TIMECARD_STATUSES } = await import('@/config/timecards')
  const [row] = await db
    .select({ cnt: count() })
    .from(timecards)
    .where(eq(timecards.status, TIMECARD_STATUSES.SUBMITTED))
  return Number(row?.cnt ?? 0)
}
