'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { InlineDecisionActions } from './InlineDecisionActions'

interface ProposalRow {
  id: string
  title: string
  category: string | null
  proposerName: string | null
  createdAt: string
}

/**
 * Workshop proposals — inline approve/reject in the Freigaben hub. Calls the
 * SAME domain endpoint as /admin/workshops (approve creates the workshop +
 * instance in a transaction; never bypass it). "Details" links to the full
 * proposal page for deep review and Änderungen-anfordern.
 */
export function WorkshopProposalsSection() {
  const router = useRouter()
  const [items, setItems] = useState<ProposalRow[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const result = await apiFetch<{ items: ProposalRow[] }>(
      '/api/admin/workshops/proposals?status=pending&limit=50'
    )
    if (result.success && result.data) setItems(result.data.items ?? [])
    setLoaded(true)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async fetch on mount */
  useEffect(() => { void load() }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const decide = (id: string) => async (decision: 'approve' | 'reject', reason: string) => {
    const result = await apiFetch<void>(`/api/admin/workshops/proposals/${id}/approve`, {
      method: 'POST',
      body: {
        action: decision,
        review_notes: reason || (decision === 'approve' ? 'Im Freigaben-Hub genehmigt' : 'Im Freigaben-Hub abgelehnt'),
      },
    })
    if (!result.success) return result.error || 'Aktion fehlgeschlagen.'
    await load()
    router.refresh()
    return null
  }

  if (!loaded || items.length === 0) return null

  return (
    <div className="bg-surface-base rounded-xl border border">
      <div className="p-4 border-b border flex items-center justify-between">
        <Heading level={2} className="font-semibold text-text-primary">Workshop-Vorschläge</Heading>
        <Link href="/admin/workshops" className="text-sm text-action hover:underline">
          Alle Workshops →
        </Link>
      </div>
      <div className="divide-y divide-subtle">
        {items.map(item => (
          <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{item.title}</p>
              <p className="text-sm text-text-tertiary">
                {[
                  item.category,
                  item.proposerName,
                  formatDateShort(item.createdAt),
                ].filter(Boolean).join(' • ')}
              </p>
              <Link
                href={`/admin/workshops/proposals/${item.id}`}
                className="mt-1 inline-flex items-center gap-1 text-xs text-action hover:underline"
              >
                Details & Änderungen anfordern <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <InlineDecisionActions onDecide={decide(item.id)} rejectReasonRequired />
          </div>
        ))}
      </div>
    </div>
  )
}
