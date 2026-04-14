import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getDecisionById } from '@/lib/services/decisions'
import { getParticipationStatus } from '@/lib/services/decisions-voting'
import {
  DECISION_STATUS,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  PARTICIPANT_SCOPE_CONFIG,
  DECISION_STATUS_CONFIG,
  type VotingMethod,
  type DecisionStatus,
  type DecisionType,
  type ParticipantScope,
} from '@/config/decisions'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import DashboardVotingClient from './DashboardVotingClient'
import BackgroundSection from './BackgroundSection'

export const metadata: Metadata = {
  title: 'Abstimmung | RevampIT Dashboard',
}

type Props = { params: Promise<{ id: string }> }

export default async function DashboardDecisionPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/signin')

  const { id } = await params

  const [userRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))

  if (!userRow) redirect('/auth/signin')

  const decision = await getDecisionById(id, userRow.id)
  if (!decision) notFound()

  // Only show voting/discussion decisions here
  const decisionStatus = decision.status as DecisionStatus
  if (decisionStatus !== DECISION_STATUS.VOTING && decisionStatus !== DECISION_STATUS.DISCUSSION) {
    redirect('/dashboard/decisions')
  }

  const participation = await getParticipationStatus(id)
  const statusConf = DECISION_STATUS_CONFIG[decisionStatus]
  const methodConf = VOTING_METHOD_CONFIG[decision.votingMethod as VotingMethod]
  const typeConf = DECISION_TYPE_CONFIG[decision.decisionType as DecisionType]
  const scopeConf = PARTICIPANT_SCOPE_CONFIG[decision.participantScope as ParticipantScope]

  // Time remaining calculation
  let timeRemaining: string | null = null
  if (decision.votingDeadline) {
    // eslint-disable-next-line react-hooks/purity -- server component, Date.now() is safe here
    const msLeft = new Date(decision.votingDeadline).getTime() - Date.now()
    if (msLeft > 0) {
      const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60))
      if (hoursLeft >= 48) {
        timeRemaining = `${Math.floor(hoursLeft / 24)} Tage`
      } else if (hoursLeft >= 1) {
        timeRemaining = `${hoursLeft} Stunden`
      } else {
        timeRemaining = 'weniger als 1 Stunde'
      }
    }
  }

  const participationPct = participation?.progressPercent ?? 0
  const votedCount = participation?.voted.length ?? 0
  const totalCount = participation?.total ?? 0
  const quorumTarget = participation?.quorumTarget ?? 0
  const quorumMet = participation?.quorumMet ?? false

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Status row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConf.color}`}>
          {statusConf.label}
        </span>
        {typeConf && (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            <span>{typeConf.icon}</span>
            {typeConf.label}
          </span>
        )}
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          {methodConf.label}
        </span>
        {scopeConf && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {scopeConf.label}
          </span>
        )}
      </div>

      {/* Title */}
      <Heading level={1} className="mb-3 text-2xl font-bold text-gray-900">
        {decision.title}
      </Heading>

      {/* Description — what we're deciding */}
      {decision.description && (
        <p className="mb-4 text-sm leading-relaxed text-gray-700">
          {decision.description}
        </p>
      )}

      {/* Background / rationale — collapsible */}
      {decision.background && (
        <BackgroundSection background={decision.background} />
      )}

      {/* Meta row: creator, deadline, time left */}
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>
          Erstellt von{' '}
          <span className="text-gray-600">{decision.creator.name ?? decision.creator.email}</span>
          {' '}am {formatDateShort(decision.createdAt)}
        </span>
        {decision.votingDeadline && (
          <span>
            Frist:{' '}
            <span className={timeRemaining ? 'text-amber-600 font-medium' : 'text-gray-600'}>
              {formatDateShort(decision.votingDeadline)}
            </span>
            {timeRemaining && (
              <span className="ml-1 text-amber-500">(noch {timeRemaining})</span>
            )}
          </span>
        )}
      </div>

      {/* Participation progress */}
      {decisionStatus === DECISION_STATUS.VOTING && totalCount > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">
              Beteiligung
            </span>
            <span className={quorumMet ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {votedCount} / {totalCount} Stimmen
              {quorumTarget > 0 && (
                <span className="ml-1.5 font-normal text-gray-400">
                  (Quorum: {quorumTarget})
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${quorumMet ? 'bg-green-500' : 'bg-blue-400'}`}
              style={{ width: `${participationPct}%` }}
            />
          </div>
          {!quorumMet && quorumTarget > 0 && (
            <p className="mt-1.5 text-xs text-gray-400">
              {quorumTarget - votedCount} weitere Stimme{quorumTarget - votedCount !== 1 ? 'n' : ''} für Quorum nötig
            </p>
          )}
        </div>
      )}

      {/* Options preview (for informational context, shown before ballot) */}
      {decision.options.length > 0 && decisionStatus === DECISION_STATUS.VOTING && !decision.hasUserVoted && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Zur Auswahl stehen
          </p>
          <ul className="space-y-1.5">
            {decision.options.map((opt) => (
              <li key={opt.id} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 text-gray-300">—</span>
                <span>
                  <span className="font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="ml-1 text-gray-400">{opt.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Voting Panel */}
      {decisionStatus === DECISION_STATUS.VOTING && (
        <DashboardVotingClient
          decisionId={decision.id}
          votingMethod={decision.votingMethod as VotingMethod}
          options={decision.options.flatMap((o) =>
            o.id ? [{ id: o.id, label: o.label, description: o.description, imageUrl: o.imageUrl }] : []
          )}
          dotCount={decision.dotCount}
          hasUserVoted={decision.hasUserVoted}
          votingDeadline={decision.votingDeadline}
        />
      )}

      {decisionStatus === DECISION_STATUS.DISCUSSION && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Diese Abstimmung befindet sich noch in der Diskussionsphase. Du wirst per E-Mail benachrichtigt, wenn die Abstimmung geöffnet wird.
        </div>
      )}
    </div>
  )
}
