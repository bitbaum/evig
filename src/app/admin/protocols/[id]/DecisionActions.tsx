'use client'

/**
 * Decision Actions Component
 *
 * Renders the 4-stage decision lifecycle for a single decision item:
 * 1. Open voting (thumbs up/down with counts)
 * 2. Closed & approved (propose tasks button)
 * 3. Proposals shown (review + bulk create)
 * 4. Tasks created (confirmation)
 *
 * Created: 2026-02-10
 */

import { useState } from 'react'
import {
  DECISION_RESULTS,
  DECISION_RESULT_LABELS,
  DECISION_RESULT_COLORS,
  PRIORITY_HINT_LABELS,
} from '@/config/protocols'
import { TASK_PRIORITIES } from '@/config/tasks'
import type { DecisionResult } from '@/config/protocols'
import type {
  DecisionVoteRecord,
  DecisionOutcomeRecord,
  ProposedTask,
} from '@/lib/schemas/protocols'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface DecisionActionsProps {
  protocolId: string
  actionItemId: string
  votes: DecisionVoteRecord[]
  outcome: DecisionOutcomeRecord | undefined
  currentUserId: string
  isProtocolCreator: boolean
  attendeeCount: number
  onRefresh: () => void
}

export default function DecisionActions({
  protocolId,
  actionItemId,
  votes,
  outcome,
  currentUserId,
  isProtocolCreator,
  attendeeCount,
  onRefresh,
}: DecisionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Local optimistic state
  const [localVotes, setLocalVotes] = useState(votes)
  const [localOutcome, setLocalOutcome] = useState(outcome)

  const isClosed = localOutcome?.is_closed ?? false
  const result = (localOutcome?.result ?? DECISION_RESULTS.PENDING) as DecisionResult
  const votesUp = localOutcome?.votes_up ?? localVotes.filter(v => v.vote_type === 'up').length
  const votesDown = localOutcome?.votes_down ?? localVotes.filter(v => v.vote_type === 'down').length
  const totalVoters = new Set(localVotes.map(v => v.voter_id)).size
  const currentUserVote = localVotes.find(v => v.voter_id === currentUserId)?.vote_type
  const hasProposals = localOutcome?.proposed_tasks && localOutcome.proposed_tasks.length > 0
  const tasksCreated = localOutcome?.tasks_created ?? false

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isClosed) return
    setLoading('vote')
    setError(null)

    try {
      const res = await apiFetch<{ action: string; votesUp: number; votesDown: number; isClosed: boolean; result: DecisionResult }>(`/api/protocols/${protocolId}/decisions/vote`, {
        method: 'POST',
        body: { action_item_id: actionItemId, vote_type: voteType },
      })

      if (!res.success) {
        throw new Error(res.error || 'Abstimmung fehlgeschlagen')
      }

      // Update local state optimistically
      const { action, votesUp: newUp, votesDown: newDown, isClosed: newClosed, result: newResult } = res.data!

      // Update votes list
      if (action === 'removed') {
        setLocalVotes(prev => prev.filter(v => v.voter_id !== currentUserId))
      } else if (action === 'changed') {
        setLocalVotes(prev => prev.map(v =>
          v.voter_id === currentUserId ? { ...v, vote_type: voteType } : v
        ))
      } else {
        setLocalVotes(prev => [...prev, {
          id: crypto.randomUUID(),
          protocol_id: protocolId,
          action_item_id: actionItemId,
          voter_id: currentUserId,
          vote_type: voteType,
          created_at: new Date().toISOString(),
        }])
      }

      setLocalOutcome(prev => ({
        ...(prev || {
          id: '',
          protocol_id: protocolId,
          action_item_id: actionItemId,
          closed_by: null,
          closed_at: null,
          proposed_tasks: null,
          proposal_model: null,
          tasks_created: false,
        }),
        is_closed: newClosed,
        result: newResult,
        votes_up: newUp,
        votes_down: newDown,
      }))

      if (newClosed) {
        onRefresh()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleClose = async () => {
    setLoading('close')
    setError(null)

    try {
      const res = await apiFetch<{ result: DecisionResult; votesUp: number; votesDown: number }>(`/api/protocols/${protocolId}/decisions/close`, {
        method: 'POST',
        body: { action_item_id: actionItemId },
      })

      if (!res.success) {
        throw new Error(res.error || 'Schliessen fehlgeschlagen')
      }

      setLocalOutcome(prev => prev ? {
        ...prev,
        is_closed: true,
        result: res.data!.result,
        votes_up: res.data!.votesUp,
        votes_down: res.data!.votesDown,
      } : prev)

      onRefresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handlePropose = async () => {
    setLoading('propose')
    setError(null)

    try {
      const res = await apiFetch<{ proposals: ProposedTask[]; model: string }>(`/api/protocols/${protocolId}/decisions/propose`, {
        method: 'POST',
        body: { action_item_id: actionItemId },
      })

      if (!res.success) {
        throw new Error(res.error || 'Vorschlag fehlgeschlagen')
      }

      setLocalOutcome(prev => prev ? {
        ...prev,
        proposed_tasks: res.data!.proposals,
        proposal_model: res.data!.model,
      } : prev)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  const handleCreateTasks = async () => {
    setLoading('create')
    setError(null)

    try {
      const res = await apiFetch<void>(`/api/protocols/${protocolId}/decisions/create-tasks`, {
        method: 'POST',
        body: { action_item_id: actionItemId },
      })

      if (!res.success) {
        throw new Error(res.error || 'Erstellen fehlgeschlagen')
      }

      setLocalOutcome(prev => prev ? {
        ...prev,
        tasks_created: true,
      } : prev)

      onRefresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}

      {/* Stage 1: Open voting */}
      {!isClosed && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              disabled={loading === 'vote'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-md border transition-colors ${
                currentUserVote === 'up'
                  ? 'bg-primary-100 border-primary-300 text-primary-800'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:border-primary-200'
              } disabled:opacity-50`}
            >
              {loading === 'vote' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="w-3.5 h-3.5" />
              )}
              {votesUp}
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={loading === 'vote'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-md border transition-colors ${
                currentUserVote === 'down'
                  ? 'bg-error-100 border-error-300 text-error-800'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-error-50 hover:border-error-200'
              } disabled:opacity-50`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              {votesDown}
            </button>
          </div>

          {attendeeCount > 0 && (
            <span className="text-xs text-neutral-500">
              {totalVoters} von {attendeeCount} abgestimmt
            </span>
          )}

          {isProtocolCreator && totalVoters > 0 && (
            <button
              onClick={handleClose}
              disabled={loading === 'close'}
              className="text-xs text-neutral-500 hover:text-neutral-700 underline disabled:opacity-50"
            >
              {loading === 'close' ? (
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              ) : null}
              Abstimmung schliessen
            </button>
          )}
        </div>
      )}

      {/* Stage 2-4: Closed */}
      {isClosed && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
              DECISION_RESULT_COLORS[result]
            }`}>
              {DECISION_RESULT_LABELS[result]}
            </span>
            <span className="text-xs text-neutral-500">
              ({votesUp}:{votesDown})
            </span>

            {/* Stage 4: Tasks created */}
            {tasksCreated && (
              <span className="flex items-center gap-1 text-xs text-primary-600">
                <CheckCircle2 className="w-3 h-3" />
                {localOutcome?.proposed_tasks?.length || 0} Aufgaben erstellt
              </span>
            )}

            {/* Stage 2: Approved, no proposals yet */}
            {result === DECISION_RESULTS.APPROVED && !hasProposals && !tasksCreated && isProtocolCreator && (
              <button
                onClick={handlePropose}
                disabled={loading === 'propose'}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-100 disabled:opacity-50"
              >
                {loading === 'propose' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Aufgaben vorschlagen lassen
              </button>
            )}
          </div>

          {/* Stage 3: Proposals shown */}
          {hasProposals && !tasksCreated && (
            <div className="ml-0 space-y-2">
              <p className="text-xs font-medium text-neutral-600">KI-Vorschläge:</p>
              <ul className="space-y-1">
                {localOutcome!.proposed_tasks!.map((task: ProposedTask, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-700 bg-neutral-50 rounded px-2 py-1.5">
                    <span className="flex-1">
                      {task.title}
                      {task.priority && task.priority !== TASK_PRIORITIES.NORMAL && (
                        <span className="ml-1 text-neutral-500">
                          ({PRIORITY_HINT_LABELS[task.priority] || task.priority})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {isProtocolCreator && (
                <button
                  onClick={handleCreateTasks}
                  disabled={loading === 'create'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading === 'create' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Alle Aufgaben erstellen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
