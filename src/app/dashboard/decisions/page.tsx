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
import { StatusBadge } from '@/components/ui/status-badge'
import { ROUTES } from '@/config/routes'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'dashboard.meta' })
  return {
    title: { absolute: `${t('decisionsTitle')} | ${ORG.name} Dashboard` },
    description: t('decisionsDesc'),
  }
}

export default async function DashboardDecisionsPage() {
  const t = await getTranslations('dashboard.decisions')
  const session = await auth()
  if (!session?.user?.email) {
    redirect(`${ROUTES.public.login}?callbackUrl=${encodeURIComponent('/dashboard/decisions')}`)
  }

  const [userRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!userRow) {
    redirect(`${ROUTES.public.login}?callbackUrl=${encodeURIComponent('/dashboard/decisions')}`)
  }

  let votingDecisions: Awaited<ReturnType<typeof getDecisions>>['decisions'] = []
  try {
    const result = await getDecisions({ status: DECISION_STATUS.VOTING, page: 1, limit: 50 }, userRow.id)
    votingDecisions = result.decisions
  } catch (error) {
    logger.error('Failed to fetch voting decisions for dashboard', { userId: userRow.id, error })
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-subtle pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {t('pageSubtitle')}
        </p>
        <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
          {t('pageTitle')}
        </Heading>
      </header>

      {votingDecisions.length === 0 ? (
        <p className="rounded-lg border border-subtle bg-surface-raised p-8 text-center text-sm text-text-tertiary">
          {t('noVotings')}
        </p>
      ) : (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle bg-surface-base">
          {votingDecisions.map(d => {
            const statusConf = DECISION_STATUS_CONFIG[d.status as DecisionStatus]
            const methodConf = VOTING_METHOD_CONFIG[d.votingMethod as VotingMethod]
            const deadlineInfo = d.votingDeadline
              ? t('deadline', { date: formatDateShort(d.votingDeadline) })
              : null

            return (
              <li key={d.id}>
                <Link
                  href={`/dashboard/decisions/${d.id}`}
                  className="group flex items-start justify-between gap-3 p-4 transition-colors hover:bg-surface-raised"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{d.title}</p>
                    {d.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-tertiary">
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
                        <StatusBadge variant="warning" tone="subtle">{deadlineInfo}</StatusBadge>
                      )}
                      {d.hasUserVoted ? (
                        <span className="rounded-full bg-action-muted px-2 py-0.5 text-xs text-action">
                          {t('voted')}
                        </span>
                      ) : (
                        <StatusBadge variant="warning">{t('votePending')}</StatusBadge>
                      )}
                    </div>
                  </div>
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-action"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
