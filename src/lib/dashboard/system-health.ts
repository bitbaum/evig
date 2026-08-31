import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { jobRuns } from '@/db/schema/misc';
import { logger } from '@/lib/logger';

// Show failures in the last 24 hours
export const SYSTEM_HEALTH_WINDOW_HOURS = 24;

export interface JobHealth {
  job_name: string;
  failure_count: number;
  last_ran_at: string | null;
}

export async function getUnhealthyJobs(): Promise<JobHealth[]> {
  const table = getTableName(jobRuns);

  try {
    const result = await db.execute(sql`
      SELECT
        job_name,
        COUNT(*) FILTER (WHERE success = false) AS failure_count,
        MAX(ran_at) AS last_ran_at
      FROM ${sql.raw(table)}
      WHERE ran_at >= NOW() - (${SYSTEM_HEALTH_WINDOW_HOURS} || ' hours')::interval
      GROUP BY job_name
      HAVING COUNT(*) FILTER (WHERE success = false) > 0
      ORDER BY failure_count DESC
    `);
    return result.rows as unknown as JobHealth[];
  } catch (error) {
    // Table may not exist yet — fail silently
    logger.warn('SystemHealthBar query failed', { error });
    return [];
  }
}
