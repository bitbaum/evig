'use client'

import { useState } from 'react'
import { CheckCircle, Vote, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { type VotingMethod } from '@/config/decisions'
import { useVoteState } from '@/hooks/useVoteState'
import { ConsentVote } from '@/app/admin/decisions/[id]/voting/ConsentVote'
import { ApprovalVote } from '@/app/admin/decisions/[id]/voting/ApprovalVote'
import { DotVote } from '@/app/admin/decisions/[id]/voting/DotVote'
import { ScoreVote } from '@/app/admin/decisions/[id]/voting/ScoreVote'
import { RankedChoiceVote } from '@/app/admin/decisions/[id]/voting/RankedChoiceVote'
import { SimpleMajorityVote } from '@/app/admin/decisions/[id]/voting/SimpleMajorityVote'
import { DeadlineCountdown } from '@/app/admin/decisions/[id]/voting/DeadlineCountdown'
import { VoteAIAdvisor } from '@/components/decisions/VoteAIAdvisor'

interface Option {
  id: string
  label: string
  description?: string
  imageUrl?: string
}

interface Props {
  decisionId: string
  title: string
  description: string
  background?: string | null
  votingMethod: VotingMethod
  options: Option[]
  dotCount: number | null
  votingDeadline: string | null
  isVotingPhase: boolean
  allowPublicVoting: boolean
  registerUrl: string
  loginUrl: string
}

export default function PublicVoteClient({
  decisionId,
  title,
  description,
  background,
  votingMethod,
  options,
  dotCount,
  votingDeadline,
  isVotingPhase,
  allowPublicVoting,
  registerUrl,
  loginUrl,
}: Props) {
  const t = useTranslations('vote')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const vote = useVoteState({ votingMethod, options, dotCount })

  const hasImages = options.some((o) => o.imageUrl)
  const isGalleryMode = hasImages || (
    options.length > 5 && (votingMethod === 'approval' || votingMethod === 'score' || votingMethod === 'dot')
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError(t('emailRequired'))
      return
    }

    setError('')
    setSubmitting(true)

    const voteData = vote.buildVoteData()

    const result = await apiFetch<unknown>(`/api/vote/${decisionId}`, {
      method: 'POST',
      body: { email: email.trim(), voteData },
    })
    if (!result.success) {
      setError(result.error || t('submitError'))
      setSubmitting(false)
      return
    }
    setSuccess(true)
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-primary-50 border border-primary-200 p-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-primary-500 mb-3" />
          <p className="text-lg font-semibold text-primary-800">{t('successHeading')}</p>
          <p className="mt-1 text-sm text-primary-700">{t('successDesc')}</p>
        </div>

        {/* Registration gate — results require an account */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <UserPlus className="h-5 w-5 text-neutral-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">{t('successRegisterHeading')}</p>
              <p className="mt-1 text-sm text-neutral-600">{t('successRegisterDesc')}</p>
              <Link
                href={registerUrl}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                {t('successRegisterCta')}
              </Link>
              <p className="mt-3 text-xs text-neutral-500">
                {t('successOrLogin')}{' '}
                <Link href={loginUrl} className="text-primary-600 hover:underline">
                  {t('successLoginCta')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isVotingPhase) {
    return (
      <div className="rounded-xl bg-warning-50 border border-warning-200 p-6 text-center">
        <p className="text-warning-800 font-medium">{t('notStartedHeading')}</p>
        <p className="mt-1 text-sm text-warning-700">
          {t('notStartedDesc')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {votingDeadline && (
        <DeadlineCountdown deadline={votingDeadline} />
      )}

      {/* AI Advisor — lets voters understand the decision before voting */}
      <VoteAIAdvisor
        title={title}
        description={description}
        background={background}
        votingMethod={votingMethod}
        options={options.map(o => ({ label: o.label, description: o.description }))}
      />

      {/* Email identification */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5">
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          {t('emailLabel')}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1.5 text-xs text-neutral-700">
          {allowPublicVoting ? t('emailHintPublic') : t('emailHint')}
        </p>
      </div>

      {/* Ballot */}
      <div className="rounded-xl bg-white border border-neutral-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral-700 mb-4">{t('yourVote')}</p>

        {votingMethod === 'consent' && (
          <ConsentVote
            response={vote.consentResponse}
            rationale={vote.rationale}
            onResponseChange={vote.setConsentResponse}
            onRationaleChange={vote.setRationale}
          />
        )}
        {votingMethod === 'approval' && (
          <ApprovalVote
            options={options}
            approvedOptions={vote.approvedOptions}
            isGalleryMode={isGalleryMode}
            onToggle={vote.toggleApproval}
          />
        )}
        {votingMethod === 'dot' && (
          <DotVote
            options={options}
            allocations={vote.allocations}
            maxDots={vote.maxDots}
            usedDots={vote.usedDots}
            isGalleryMode={isGalleryMode}
            onSet={vote.setAllocation}
          />
        )}
        {votingMethod === 'score' && (
          <ScoreVote
            options={options}
            scores={vote.scores}
            isGalleryMode={isGalleryMode}
            onSet={vote.setScore}
          />
        )}
        {votingMethod === 'simple_majority' && (
          <SimpleMajorityVote
            response={vote.majorityResponse}
            onChange={vote.setMajorityResponse}
          />
        )}
        {votingMethod === 'ranked_choice' && (
          <RankedChoiceVote
            options={options}
            ranking={vote.ranking}
            onMoveUp={vote.moveRankingUp}
            onMoveDown={vote.moveRankingDown}
          />
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Vote className="h-4 w-4" />
        {submitting ? t('saving') : t('submit')}
      </button>
    </form>
  )
}
