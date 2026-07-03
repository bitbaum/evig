'use client'

import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { InlineDecisionActions } from '@/components/admin/approvals/InlineDecisionActions'

/**
 * Approve/reject a user content submission from the Freigaben hub.
 * Rejections carry an optional reason that reaches the submitter (email +
 * in-app) — a bare "abgelehnt" left people guessing what to fix.
 */
export function ApprovalActions({ submissionId }: { submissionId: string }) {
  const router = useRouter()

  const decide = async (decision: 'approve' | 'reject', reason: string) => {
    const result = await apiFetch<unknown>(`/api/admin/approvals/${submissionId}`, {
      method: 'PATCH',
      body: { action: decision, ...(reason ? { reason } : {}) },
    })
    if (!result.success) return result.error || 'Aktion fehlgeschlagen.'
    router.refresh()
    return null
  }

  return <InlineDecisionActions onDecide={decide} />
}
