'use client'

import { useState } from 'react'
import { CheckCircle, Vote } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { type VotingMethod, type ConsentResponse, type SimpleMajorityResponse } from '@/config/decisions'
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
}: Props) {
  const t = useTranslations('vote')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Per-method vote state
  const [consentResponse, setConsentResponse] = useState<ConsentResponse>('agree')
  const [rationale, setRationale] = useState('')
  const [approvedOptions, setApprovedOptions] = useState<Set<string>>(new Set())
  const maxDots = dotCount || 5
  const [allocations, setAllocations] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 0]))
  )
  const usedDots = Object.values(allocations).reduce((a, b) => a + b, 0)
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 0]))
  )
  const [majorityResponse, setMajorityResponse] = useState<SimpleMajorityResponse>('yes')
  const [ranking, setRanking] = useState<string[]>(() => options.map((o) => o.id))

  function toggleApproval(optId: string) {
    setApprovedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(optId)) next.delete(optId)
      else next.add(optId)
      return next
    })
  }

  function setAllocation(optId: string, value: number) {
    setAllocations((prev) => ({ ...prev, [optId]: value }))
  }

  function setScore(optId: string, score: number) {
    setScores((prev) => ({ ...prev, [optId]: score }))
  }

  function moveRankingUp(index: number) {
    if (index === 0) return
    setRanking((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveRankingDown(index: number) {
    if (index === ranking.length - 1) return
    setRanking((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError(t('emailRequired'))
      return
    }

    setError('')
    setSubmitting(true)

    let voteData: unknown
    switch (votingMethod) {
      case 'consent':         voteData = { response: consentResponse, rationale: rationale || undefined }; break
      case 'approval':        voteData = { approved_options: Array.from(approvedOptions) }; break
      case 'dot':             voteData = { allocations }; break
      case 'score':           voteData = { scores }; break
      case 'simple_majority': voteData = { response: majorityResponse }; break
      case 'ranked_choice':   voteData = { ranking }; break
    }

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
      <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <p className="text-lg font-semibold text-green-800">{t('successHeading')}</p>
        <p className="mt-1 text-sm text-green-700">
          {t('successDesc')}
        </p>
      </div>
    )
  }

  if (!isVotingPhase) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
        <p className="text-amber-800 font-medium">{t('notStartedHeading')}</p>
        <p className="mt-1 text-sm text-amber-700">
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
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <label className="block text-sm font-semibold text-blue-900 mb-2">
          {t('emailLabel')}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1.5 text-xs text-blue-700">
          {t('emailHint')}
        </p>
      </div>

      {/* Ballot */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4">{t('yourVote')}</p>

        {votingMethod === 'consent' && (
          <ConsentVote
            response={consentResponse}
            rationale={rationale}
            onResponseChange={setConsentResponse}
            onRationaleChange={setRationale}
          />
        )}
        {votingMethod === 'approval' && (
          <ApprovalVote
            options={options}
            approvedOptions={approvedOptions}
            isGalleryMode={false}
            onToggle={toggleApproval}
          />
        )}
        {votingMethod === 'dot' && (
          <DotVote
            options={options}
            allocations={allocations}
            maxDots={maxDots}
            usedDots={usedDots}
            isGalleryMode={false}
            onSet={setAllocation}
          />
        )}
        {votingMethod === 'score' && (
          <ScoreVote
            options={options}
            scores={scores}
            isGalleryMode={false}
            onSet={setScore}
          />
        )}
        {votingMethod === 'simple_majority' && (
          <SimpleMajorityVote
            response={majorityResponse}
            onChange={setMajorityResponse}
          />
        )}
        {votingMethod === 'ranked_choice' && (
          <RankedChoiceVote
            options={options}
            ranking={ranking}
            onMoveUp={moveRankingUp}
            onMoveDown={moveRankingDown}
          />
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Vote className="h-4 w-4" />
        {submitting ? t('saving') : t('submit')}
      </button>
    </form>
  )
}
