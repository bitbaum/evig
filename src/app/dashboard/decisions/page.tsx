import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getDecisions } from '@/lib/services/decisions'
import { DECISION_STATUS, DECISION_STATUS_CONFIG, VOTING_METHOD_CONFIG, type DecisionStatus, type VotingMethod } from '@/config/decisions'
import { formatDateShort } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { getTranslations, getLocale } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'dashboard.meta' })
  return {
    title: `${t('decisionsTitle')} | ${ORG.name} Dashboard`,
    description: t('decisionsDesc'),
  }
}

export default async function DashboardDecisionsPage() {
  const t = await getTranslations('dashboard.decisions')
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/signin')

  const [userRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!userRow) redirect('/auth/signin')

  let votingDecisions: Awaited<ReturnType<typeof getDecisions>>['decisions'] = []
  try {
    const result = await getDecisions({ status: DECISION_STATUS.VOTING, page: 1, limit: 50 }, userRow.id)
    votingDecisions = result.decisions
  } catch (error) {
    logger.error('Failed to fetch voting decisions for dashboard', { userId: userRow.id, error })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Heading level={1} className="mb-1 text-2xl font-bold text-text-primary">
        {t('pageTitle')}
      </Heading>
      <p className="mb-6 text-sm text-text-tertiary">
        {t('pageSubtitle')}
      </p>

      {votingDecisions.length === 0 ? (
        <div className="rounded-lg border border bg-surface-raised p-8 text-center">
          <p className="text-sm text-text-tertiary">{t('noVotings')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {votingDecisions.map((d) => {
            const statusConf = DECISION_STATUS_CONFIG[d.status as DecisionStatus]
            const methodConf = VOTING_METHOD_CONFIG[d.votingMethod as VotingMethod]
            const deadlineInfo = d.votingDeadline
              ? t('deadline', { date: formatDateShort(d.votingDeadline) })
              : null

            return (
              <Link
                key={d.id}
                href={`/dashboard/decisions/${d.id}`}
                className="block rounded-lg border border bg-surface-base p-4 hover:border-action dark:hover:border-action hover:shadow-xs dark:hover:shadow-black/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary truncate">{d.title}</p>
                    {d.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-text-tertiary">
                        {d.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                      <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-text-secondary">
                        {methodConf.label}
                      </span>
                      {deadlineInfo && (
                        <span className="rounded-full bg-warning-50 dark:bg-warning-900/30 px-2 py-0.5 text-xs text-warning-700 dark:text-warning-300">
                          {deadlineInfo}
                        </span>
                      )}
                      {d.hasUserVoted ? (
                        <span className="rounded-full bg-action-muted-muted px-2 py-0.5 text-xs text-action">
                          {t('voted')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning-100 dark:bg-warning-900/30 px-2 py-0.5 text-xs text-warning-700 dark:text-warning-300 font-medium">
                          {t('votePending')}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
