import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getDecisions } from '@/lib/services/decisions'
import { DECISION_STATUS_CONFIG, VOTING_METHOD_CONFIG, type DecisionStatus, type VotingMethod } from '@/config/decisions'
import { formatDateShort } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Abstimmungen | RevampIT Dashboard',
  description: 'Offene Abstimmungen, bei denen deine Stimme zählt.',
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
    const result = await getDecisions({ status: 'voting', page: 1, limit: 50 }, userRow.id)
    votingDecisions = result.decisions
  } catch (error) {
    logger.error('Failed to fetch voting decisions for dashboard', { userId: userRow.id, error })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Heading level={1} className="mb-1 text-2xl font-bold text-gray-900">
        {t('pageTitle')}
      </Heading>
      <p className="mb-6 text-sm text-gray-500">
        {t('pageSubtitle')}
      </p>

      {votingDecisions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">{t('noVotings')}</p>
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
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{d.title}</p>
                    {d.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                        {d.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {methodConf.label}
                      </span>
                      {deadlineInfo && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          {deadlineInfo}
                        </span>
                      )}
                      {d.hasUserVoted ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          {t('voted')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-medium">
                          {t('votePending')}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400"
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
