'use client'

/**
 * Decision Bridge — protocol action item ↔ standalone decision (QQ.6)
 *
 * Replaces the legacy inline thumbs-vote (`DecisionActions.tsx`) which used
 * the now-deprecated `protocol_decision_votes` + `protocol_decision_outcomes`
 * tables. Architecture: action items in a meeting protocol can be promoted
 * to standalone decisions; the decisions table tracks them via
 * `protocol_id` + `action_item_id` (migration 086).
 *
 * Flow:
 *   1. No linked decision → "Als Entscheidung verschieben"
 *   2. Decision open → status + link to /admin/decisions/[id]
 *   3. Decision closed + approved → one-click "Aufgabe erstellen" (linked task)
 *   4. Task linked → link to /admin/tasks/[id]
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { DECISION_STATUS, DECISION_STATUS_CONFIG, type DecisionStatus } from '@/config/decisions'
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud'

interface DecisionBridgeProps {
  protocolId: string
  actionItemId: string
  actionItemDescription: string
  linkedDecision: ProtocolDecisionSummary | undefined
  isProtocolCreator: boolean
  onRefresh: () => void
}

type DecisionStatusToken = DecisionStatus

const STATUS_BADGE_VARIANT: Record<DecisionStatusToken, 'warning' | 'success' | 'neutral' | 'info'> = {
  draft: 'neutral',
  discussion: 'info',
  voting: 'warning',
  closed: 'success',
  cancelled: 'neutral',
}

export default function DecisionBridge({
  protocolId,
  actionItemId,
  actionItemDescription,
  linkedDecision,
  isProtocolCreator,
  onRefresh,
}: DecisionBridgeProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (linkedDecision?.linkedTaskId) {
    return (
      <Link
        href={`/admin/tasks/${linkedDecision.linkedTaskId}`}
        className="inline-flex items-center gap-1 text-xs text-action hover:text-action"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Aufgabe verknüpft
        <ExternalLink className="w-3 h-3" />
      </Link>
    )
  }

  if (linkedDecision) {
    const status = linkedDecision.status as DecisionStatusToken
    const statusConfig = DECISION_STATUS_CONFIG[status]
    const isThumbs = linkedDecision.votingMethod === 'thumbs_up_down'
    const canCreateTask = linkedDecision.isClosed
      && linkedDecision.status !== DECISION_STATUS.CANCELLED
      && linkedDecision.outcomePassed !== false
      && isProtocolCreator

    const handleCreateTask = async () => {
      setCreatingTask(true)
      setError(null)
      try {
        const res = await apiFetch<{ taskId: string }>(
          `/api/decisions/${linkedDecision.id}/create-task`,
          { method: 'POST' },
        )
        if (!res.success) {
          throw new Error(res.error || 'Aufgabe konnte nicht erstellt werden')
        }
        onRefresh()
        router.refresh()
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setCreatingTask(false)
      }
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <StatusBadge variant={STATUS_BADGE_VARIANT[status]} size="sm">
            {statusConfig?.label ?? status}
          </StatusBadge>
          {isThumbs && (linkedDecision.votesUp > 0 || linkedDecision.votesDown > 0) && (
            <span className="text-text-tertiary">
              👍 {linkedDecision.votesUp} · 👎 {linkedDecision.votesDown}
            </span>
          )}
          <Link
            href={`/admin/decisions/${linkedDecision.id}`}
            className="inline-flex items-center gap-1 text-action hover:text-action-hover transition-colors"
          >
            Zur Entscheidung
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {error && <p className="text-xs text-error-600">{error}</p>}
        {canCreateTask && (
          <Button
            onClick={handleCreateTask}
            disabled={creatingTask}
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-1 text-xs text-action hover:text-action h-auto px-0 bg-transparent hover:bg-transparent"
          >
            {creatingTask
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ListChecks className="w-3.5 h-3.5" />
            }
            Aufgabe erstellen
          </Button>
        )}
        {linkedDecision.isClosed && linkedDecision.outcomePassed === false && (
          <p className="text-xs text-text-tertiary">Abgelehnt — keine Folgeaufgabe vorgeschlagen.</p>
        )}
      </div>
    )
  }

  if (!isProtocolCreator) {
    return (
      <p className="text-xs text-text-tertiary">
        Noch keine Entscheidung. Nur die Protokoll-Erstellerin kann eine ableiten.
      </p>
    )
  }

  const handleCreate = async () => {
    setCreating(true)
    setError(null)

    const trimmed = actionItemDescription.trim().replace(/[.;…]+$/, '')
    const title = trimmed.length <= 80 ? trimmed : `${trimmed.slice(0, 77)}…`

    try {
      const res = await apiFetch<{ id: string }>('/api/decisions', {
        method: 'POST',
        body: {
          title,
          description: actionItemDescription,
          decisionType: 'sense_check',
          votingMethod: 'thumbs_up_down',
          protocolId,
          actionItemId,
          initialStatus: 'voting',
        },
      })

      if (!res.success) {
        throw new Error(res.error || 'Entscheidung konnte nicht erstellt werden')
      }

      onRefresh()
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-error-600">{error}</p>}
      <Button
        onClick={handleCreate}
        disabled={creating}
        variant="outline"
        size="sm"
        className="inline-flex items-center gap-1.5"
      >
        {creating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        Als Entscheidung verschieben
      </Button>
    </div>
  )
}
