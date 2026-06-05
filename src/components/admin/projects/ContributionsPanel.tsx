'use client'

/**
 * ContributionsPanel — triage inbox for inbound visitor offers.
 *
 * Receives a scoped translator `admin.projects` and resolves labels inline.
 */

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CONTRIBUTION_STATUSES, type ContributionStatus } from '@/config/projects'
import { Mail, Building2, Phone, Save } from 'lucide-react'

interface Need {
  id: string
  title: string
}

interface Contribution {
  id: string
  needId: string | null
  name: string
  email: string
  phone: string | null
  organization: string | null
  message: string
  status: string
  internalNotes: string | null
  respondedAt: string | null
  respondedByName: string | null
  createdAt: string | null
}

interface Props {
  slug: string
  initialContributions: Contribution[]
  needs: Need[]
}

const STATUS_BADGE: Record<ContributionStatus, string> = {
  new:       'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-400',
  contacted: 'bg-info-100 text-info-800 dark:bg-info-500/15 dark:text-info-400',
  accepted:  'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-400',
  declined:  'bg-surface-raised text-text-secondary dark:bg-surface-base/6 dark:text-text-muted',
}

export function ContributionsPanel({ slug, initialContributions, needs }: Props) {
  const t = useTranslations('admin.projects' as never) as (k: string, v?: Record<string, string>) => string

  const [items, setItems] = useState<Contribution[]>(initialContributions)
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<ContributionStatus | 'all'>('all')

  const needById = useMemo(() => Object.fromEntries(needs.map(n => [n.id, n])), [needs])
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  function patch(id: string, changes: Partial<Contribution>) {
    setItems(prev => prev.map(c => (c.id === id ? { ...c, ...changes } : c)))
  }

  async function save(c: Contribution) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(slug)}/contributions/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: c.status, internalNotes: c.internalNotes }),
      })
      if (!res.ok) {
        alert(t('contributions.errorSave'))
        return
      }
      const json = await res.json().catch(() => null)
      if (json?.success) patch(c.id, { respondedAt: json.data.respondedAt ?? c.respondedAt })
    })
  }

  return (
    <section className={cn(designPrimitive.surface.card, 'p-4 sm:p-5')}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">{t('contributions.title')}</h2>
          <p className="text-xs text-text-tertiary mt-0.5">{t('contributions.subtitle')}</p>
        </div>
        <Select
          value={filter}
          onChange={e => setFilter(e.target.value as ContributionStatus | 'all')}
          className="text-xs w-auto"
        >
          <option value="all">{t('contributions.filterAll')}</option>
          {Object.values(CONTRIBUTION_STATUSES).map(s => (
            <option key={s} value={s}>{t(`contributionStatusLabels.${s}`)}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-8">
          {filter === 'all'
            ? t('contributions.emptyAll')
            : t('contributions.emptyFiltered', { status: t(`contributionStatusLabels.${filter}`) })}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const need = c.needId ? needById[c.needId] : null
            return (
              <div key={c.id} className="rounded-lg border border p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary wrap-break-word">
                        {c.name}
                      </h3>
                      <span className={cn(designPrimitive.badgeBase, STATUS_BADGE[c.status as ContributionStatus] ?? STATUS_BADGE.new)}>
                        {t(`contributionStatusLabels.${c.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {t('contributions.needLabel')}:{' '}
                      <span className="font-medium">{need?.title ?? t('contributions.needFallback')}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary w-full sm:w-auto">
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-action break-all">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {c.email}
                    </a>
                    {c.phone && (
                      <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>
                    )}
                    {c.organization && (
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {c.organization}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-sm bg-surface-raised dark:bg-surface-base/3 border border-subtle p-3 text-sm text-text-secondary whitespace-pre-wrap mb-3 wrap-break-word">
                  {c.message}
                </div>

                <div className="grid gap-2 grid-cols-1 sm:grid-cols-12">
                  <Select
                    value={c.status}
                    onChange={e => patch(c.id, { status: e.target.value })}
                    className="text-xs sm:col-span-4 lg:col-span-3"
                  >
                    {Object.values(CONTRIBUTION_STATUSES).map(s => (
                      <option key={s} value={s}>{t(`contributionStatusLabels.${s}`)}</option>
                    ))}
                  </Select>
                  <Textarea
                    value={c.internalNotes ?? ''}
                    onChange={e => patch(c.id, { internalNotes: e.target.value })}
                    placeholder={t('contributions.notesPlaceholder')}
                    rows={2}
                    className="text-xs sm:col-span-7 lg:col-span-8"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => save(c)}
                    disabled={pending}
                    className="sm:col-span-1 justify-center min-h-[40px]"
                    title={t('contributions.tooltipSave')}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>

                {c.respondedAt && c.respondedByName && (
                  <p className="mt-2 text-xs text-text-muted">
                    {t('contributions.lastEdited', {
                      name: c.respondedByName,
                      date: new Date(c.respondedAt).toLocaleString('de-CH'),
                    })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
