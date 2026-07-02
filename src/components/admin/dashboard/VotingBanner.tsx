import { Link } from '@/i18n/navigation'
import { Vote, Clock, ArrowRight } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { buttonClass } from '@/components/ui/button-class'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { decisions, decisionVotes, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { DECISION_STATUS, PARTICIPANT_SCOPE } from '@/config/decisions'

interface VotingBannerProps {
  userId: string
  isSuper: boolean
  isMember: boolean
}

interface PendingDecision {
  id: string
  title: string
  voting_deadline: string | null
  votes_cast: number
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'abgelaufen'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `Endet in ${hours} Std.`
  const days = Math.floor(hours / 24)
  return `Endet in ${days} Tag${days !== 1 ? 'en' : ''}`
}

export async function VotingBanner({ userId, isSuper, isMember }: VotingBannerProps) {
  const decisionsTable = getTableName(decisions)
  const votesTable = getTableName(decisionVotes)
  // users table imported to satisfy Drizzle's schema reference — not used in raw SQL
  void getTableName(users)

  let pending: PendingDecision[] = []

  try {
    // Find decisions in 'voting' status where this user is eligible and hasn't voted yet.
    // Scope resolution:
    //   all_staff   → any staff user (all admin users are staff)
    //   board_only  → super admin only
    //   all_members → users with is_member = true
    //   invited     → user ID appears in invited_participants JSON array
    const result = await db.execute(sql`
      SELECT
        d.id,
        d.title,
        d.voting_deadline,
        COUNT(dv.id)::int AS votes_cast
      FROM ${sql.raw(decisionsTable)} d
      LEFT JOIN ${sql.raw(votesTable)} dv ON dv.decision_id = d.id
      WHERE d.status = ${DECISION_STATUS.VOTING}
        AND NOT EXISTS (
          SELECT 1 FROM ${sql.raw(votesTable)} v2
          WHERE v2.decision_id = d.id AND v2.user_id = ${userId}
        )
        AND (
          d.participant_scope = ${PARTICIPANT_SCOPE.ALL_STAFF}
          OR (d.participant_scope = ${PARTICIPANT_SCOPE.BOARD_ONLY} AND ${isSuper})
          OR (d.participant_scope = ${PARTICIPANT_SCOPE.ALL_MEMBERS} AND ${isMember})
          OR (
            d.participant_scope = ${PARTICIPANT_SCOPE.INVITED}
            AND d.invited_participants::jsonb @> ${JSON.stringify([userId])}::jsonb
          )
        )
      GROUP BY d.id, d.title, d.voting_deadline
      ORDER BY d.voting_deadline ASC NULLS LAST
      LIMIT 3
    `)

    pending = result.rows as unknown as PendingDecision[]
  } catch (error) {
    logger.warn('VotingBanner query failed', { error, userId })
    return null
  }

  if (pending.length === 0) return null

  const first = pending[0]
  const more = pending.length - 1
  const deadline = formatDeadline(first.voting_deadline)

  return (
    <div className="bg-action-muted border border-strong rounded-xl overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-action-muted-hover/50 rounded-lg flex items-center justify-center shrink-0">
          <Vote className="w-5 h-5 text-action" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-action uppercase tracking-wide mb-0.5">
            Deine Stimme fehlt
          </p>
          <Heading level={2} className="font-semibold text-text-primary leading-snug">
            {first.title}
          </Heading>
          {deadline && (
            <p className="flex items-center gap-1.5 text-sm text-action mt-1">
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
              {deadline}
            </p>
          )}
          {more > 0 && (
            <p className="text-sm text-action mt-1">
              +{more} weitere offene Abstimmung{more !== 1 ? 'en' : ''}
            </p>
          )}
        </div>

        {/* CTA — min-h-touch ensures touch target */}
        <Link href={`/admin/decisions/${first.id}`} className={buttonClass({ variant: 'primary', className: 'shrink-0 self-center' })}>
          Abstimmen
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
