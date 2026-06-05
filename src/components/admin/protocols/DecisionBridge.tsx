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
 * Two states:
 *   - No linked decision yet → "Als Entscheidung verschieben" CTA. Clicking
 *     POSTs to /api/decisions with protocol_id + action_item_id + voting_method=
 *     'thumbs_up_down' + title from the action item description.
 *   - Linked decision exists → inline status badge + link to the standalone
 *     decision page. Full voting/closure/task-creation continues there.
 *
 * Why not embed the full voting widget here?
 *   The standalone decision system supports 7 voting methods (consent,
 *   approval, dot, score, simple_majority, ranked_choice, thumbs_up_down).
 *   Each has its own validation + tally + commenting + transitions UX. Trying
 *   to render that inline alongside ~5 other action items per protocol is
 *   visual noise. The bridge surfaces the *link* and a *summary*; the actual
 *   ballot lives at /admin/decisions/[id] like every other decision.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { DECISION_STATUS_CONFIG, type DecisionStatus } from '@/config/decisions'
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud'

interface DecisionBridgeProps {
  protocolId: string
  actionItemId: string
  actionItemDescription: string
  linkedDecision: ProtocolDecisionSummary | undefined
  isProtocolCreator: boolean
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
}: DecisionBridgeProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (linkedDecision) {
    const status = linkedDecision.status as DecisionStatusToken
    const statusConfig = DECISION_STATUS_CONFIG[status]
    const isThumbs = linkedDecision.votingMethod === 'thumbs_up_down'

    return (
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

    // Title = first ~80 chars of description (action items are short; full
    // description goes in the decision description so reviewers get the
    // context). Trim trailing punctuation that often comes from AI
    // extraction (period, ellipsis, semicolon).
    const trimmed = actionItemDescription.trim().replace(/[.;…]+$/, '')
    const title = trimmed.length <= 80 ? trimmed : trimmed.slice(0, 77) + '…'

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
          // Open for voting immediately — the protocol-creator workflow
          // assumes the action item IS the proposal, not a draft.
          initialStatus: 'voting',
        },
      })

      if (!res.success) {
        throw new Error(res.error || 'Entscheidung konnte nicht erstellt werden')
      }

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
