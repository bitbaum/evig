'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { InlineDecisionActions } from './InlineDecisionActions'

interface LocationRow {
  id: string
  name: string
  type: string
  city: string
  canton: string
  maxCapacity: number | null
  createdAt: string
}

/**
 * Standorte — inline approve/reject in the Freigaben hub. The decision data
 * (name, type, place, capacity) fits one row, so no drawer needed. Calls the
 * same endpoint as /admin/locations (it writes the location_approvals audit
 * row and the dual status columns — never bypass it).
 */
export function LocationApprovalsSection() {
  const router = useRouter()
  const [items, setItems] = useState<LocationRow[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const result = await apiFetch<{ locations: LocationRow[] }>(
      '/api/locations?status=pending&limit=50'
    )
    if (result.success && result.data) setItems(result.data.locations ?? [])
    setLoaded(true)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async fetch on mount */
  useEffect(() => { void load() }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const decide = (id: string) => async (decision: 'approve' | 'reject', reason: string) => {
    const result = await apiFetch<void>(`/api/locations/${id}/approve`, {
      method: 'POST',
      body: {
        action: decision,
        review_notes: reason || (decision === 'approve' ? 'Ort genehmigt' : 'Administrative Prüfung'),
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
        <Heading level={2} className="font-semibold text-text-primary">Standorte</Heading>
        <Link href="/admin/locations" className="text-sm text-action hover:underline">
          Alle Standorte →
        </Link>
      </div>
      <div className="divide-y divide-subtle">
        {items.map(item => (
          <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{item.name}</p>
              <p className="text-sm text-text-tertiary">
                {[
                  item.type,
                  `${item.city} ${item.canton}`.trim(),
                  item.maxCapacity ? `bis ${item.maxCapacity} Personen` : null,
                  formatDateShort(item.createdAt),
                ].filter(Boolean).join(' • ')}
              </p>
            </div>
            <InlineDecisionActions onDecide={decide(item.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
