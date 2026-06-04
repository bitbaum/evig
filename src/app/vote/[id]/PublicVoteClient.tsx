'use client'

import { useState } from 'react'
import { CheckCircle, Vote, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
        <div className="rounded-xl bg-action-muted/8 border border-strong dark:border-action/20 p-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-action mb-3" />
          <p className="text-lg font-semibold text-action">{t('successHeading')}</p>
          <p className="mt-1 text-sm text-action">{t('successDesc')}</p>
        </div>

        {/* Registration gate — results require an account */}
        <div className="rounded-xl border border-strong dark:border-white/6 bg-surface-base p-6 shadow-xs dark:shadow-none">
          <div className="flex items-start gap-3">
            <UserPlus className="h-5 w-5 text-text-tertiary dark:text-text-muted mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{t('successRegisterHeading')}</p>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-muted">{t('successRegisterDesc')}</p>
              <Button as={Link} href={registerUrl} variant="primary" size="sm" className="mt-3">
                {t('successRegisterCta')}
              </Button>
              <p className="mt-3 text-xs text-text-tertiary dark:text-text-muted">
                {t('successOrLogin')}{' '}
                <Link href={loginUrl} className="text-action hover:underline">
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
      <div className="rounded-xl bg-warning-50 dark:bg-yellow-500/8 border border-warning-200 dark:border-yellow-500/20 p-6 text-center">
        <p className="text-warning-800 dark:text-yellow-300 font-medium">{t('notStartedHeading')}</p>
        <p className="mt-1 text-sm text-warning-700 dark:text-yellow-400">
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
      <div className="rounded-xl bg-surface-raised border border-strong dark:border-white/6 p-5">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {t('emailLabel')}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="w-full rounded-lg border border-default dark:border-white/8 bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-action dark:focus:ring-primary-400"
        />
        <p className="mt-1.5 text-xs text-text-secondary dark:text-text-muted">
          {allowPublicVoting ? t('emailHintPublic') : t('emailHint')}
        </p>
      </div>

      {/* Ballot */}
      <div className="rounded-xl bg-surface-base border border-strong dark:border-white/6 p-5 shadow-xs dark:shadow-none">
        <p className="text-sm font-semibold text-text-secondary mb-4">{t('yourVote')}</p>

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
        <div className="rounded-lg bg-error-50 dark:bg-red-500/8 border border-error-200 dark:border-red-500/20 p-3 text-sm text-error-700 dark:text-red-300">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        variant="primary"
        className="w-full"
      >
        <Vote className="h-4 w-4" />
        {submitting ? t('saving') : t('submit')}
      </Button>
    </form>
  )
}
