import { db } from '@/db';
import { sql, getTableName } from 'drizzle-orm';
import { activityFeed, users } from '@/db/schema';
import { logger } from '@/lib/logger';

const feedTable = getTableName(activityFeed);
const usersTable = getTableName(users);

export interface FeedRow {
  actor_name: string | null;
  action: string;
  subject_label: string | null;
  created_at: string;
}

export async function getTeamActivity(): Promise<FeedRow[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        u.name AS actor_name,
        f.action,
        f.subject_label,
        f.created_at
      FROM ${sql.raw(feedTable)} f
      LEFT JOIN ${sql.raw(usersTable)} u ON u.id = f.actor_id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);
    return result.rows as unknown as FeedRow[];
  } catch (error) {
    logger.warn('TeamActivityFeed query failed', { error });
    return [];
  }
}
