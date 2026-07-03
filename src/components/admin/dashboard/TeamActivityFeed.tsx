import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { activityFeed, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { formatRelativeTime } from '@/lib/utils'
import type { ActivityAction } from '@/lib/activity'

const feedTable = getTableName(activityFeed)
const usersTable = getTableName(users)

interface FeedRow {
  actor_name: string | null
  action: string
  subject_label: string | null
  created_at: string
}

// Human-readable labels for each action type. Typed as
// Record<ActivityAction, string> so adding a new variant to the
// ActivityAction union in src/lib/activity.ts without a matching label
// here fails tsc — the prior loose Record<string, string> typing let
// the timecard variants ship silently and they displayed as raw English
// snake-case ("submitted_timecard") in the German dashboard feed.
const ACTION_LABELS: Record<ActivityAction, string> = {
  approved_listing: 'genehmigte Inserat',
  rejected_listing: 'lehnte Inserat ab',
  closed_it_hilfe: 'schloss IT-Hilfe ab',
  captured_device: 'erfasste Gerät',
  approved_blog: 'genehmigte Blogartikel',
  approved_repairer: 'genehmigte Reparateur',
  submitted_timecard: 'reichte Zeitkarte ein',
  approved_timecard: 'genehmigte Zeitkarte',
  rejected_timecard: 'wies Zeitkarte zurück',
  edited_timecard: 'passte Zeitkarte an',
  reopened_timecard: 'öffnete Zeitkarte wieder',
  recorded_membership_payment: 'erfasste Mitgliederbeitrag',
}

export async function TeamActivityFeed() {
  let rows: FeedRow[] = []

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
    `)
    rows = result.rows as unknown as FeedRow[]
  } catch (error) {
    logger.warn('TeamActivityFeed query failed', { error })
    return null
  }

  if (rows.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Team-Aktivität
      </p>
      <ul className="space-y-2" role="list">
        {rows.map((row, i) => {
          const actorName = row.actor_name?.split(' ')[0] ?? 'Jemand'
          // row.action comes from the DB column (typed as string) and
          // may be a legacy / unknown action code; fall back to the raw
          // value when the labels map has no entry. The cast is safe
          // because the lookup uses ?? to handle the undefined case.
          const actionLabel = ACTION_LABELS[row.action as ActivityAction] ?? row.action
          return (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-overlay mt-2 shrink-0" aria-hidden="true" />
              <span className="leading-snug">
                <strong className="text-text-primary font-medium">{actorName}</strong>
                {' '}{actionLabel}
                {row.subject_label && (
                  <> &ldquo;{row.subject_label}&rdquo;</>
                )}
                {' '}
                <span className="text-text-muted text-xs">
                  {formatRelativeTime(row.created_at)}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
