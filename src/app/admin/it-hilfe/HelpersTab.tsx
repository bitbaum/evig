// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helpers tab
// ---------------------------------------------------------------------------

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { adminInteractive, adminTable } from '@/lib/admin-ui'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  HelpCircle, UserCheck, ShieldCheck, Ban,
} from 'lucide-react'
import { SWISS_CANTONS } from '@/config/swiss-cantons'
import { HELPER_STATUS, HELPER_STATUS_LABELS } from '@/config/helper-status'
import type { HelperRow, PaginatedResponse, HelperFilter, Stats } from './types'
import { StatsCard, SkillTag } from './shared'
import { StatusBadge } from '@/components/ui/status-badge'

interface HelpersTabProps {
  helpers: PaginatedResponse<HelperRow> | null
  helpFilter: HelperFilter
  setHelpFilter: React.Dispatch<React.SetStateAction<HelperFilter>>
  helpOffset: number
  setHelpOffset: React.Dispatch<React.SetStateAction<number>>
  stats: Stats | null
  onAction: (helperId: string, action: string) => void
}

export function HelpersTab({
  helpers, helpFilter, setHelpFilter, helpOffset, setHelpOffset, stats, onAction,
}: HelpersTabProps) {
  const t = useTranslations('admin.itHilfe.helpers')
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={helpFilter.status} onChange={e => { setHelpFilter(f => ({ ...f, status: e.target.value })); setHelpOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allHelpers')}</option>
          <option value={HELPER_STATUS.ACTIVE}>{HELPER_STATUS_LABELS[HELPER_STATUS.ACTIVE]}</option>
          <option value={HELPER_STATUS.VERIFIED}>{HELPER_STATUS_LABELS[HELPER_STATUS.VERIFIED]}</option>
          <option value={HELPER_STATUS.SUSPENDED}>{HELPER_STATUS_LABELS[HELPER_STATUS.SUSPENDED]}</option>
        </Select>
        <Select value={helpFilter.canton} onChange={e => { setHelpFilter(f => ({ ...f, canton: e.target.value })); setHelpOffset(0) }} className="w-auto">
          <option value="">{t('filters.allCantons')}</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface-base rounded-xl border border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.name')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.skills')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.canton')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.rate')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.status')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.helps')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/4">
            {helpers?.items.map(h => (
              <tr key={h.id} className={adminTable.tr}>
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/admin/users/${h.user_id}`} className="font-medium text-action hover:underline">
                      {h.helper_name || h.helper_email}
                    </Link>
                    {h.accepts_gratis && <span className="ml-1 px-1 py-0.5 text-[10px] rounded-sm bg-action-muted text-action">{t('badges.gratis')}</span>}
                    {h.accepts_kulturlegi && <span className="ml-1 px-1 py-0.5 text-[10px] rounded-sm bg-surface-raised text-text-secondary">{t('badges.kulturlegi')}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(h.skills ?? []).slice(0, 5).map(s => <SkillTag key={s} skillId={s} />)}
                    {(h.skills ?? []).length > 5 && <span className="text-[10px] text-text-tertiary">+{(h.skills ?? []).length - 5}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-tertiary">{h.location_canton ?? '–'}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {h.hourly_rate_cents ? `CHF ${(h.hourly_rate_cents / 100).toFixed(0)}/h` : '–'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {h.suspended_at ? (
                      <StatusBadge variant="error">{t('badges.suspended')}</StatusBadge>
                    ) : h.is_verified ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action">{t('badges.verified')}</span>
                    ) : h.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action">{t('badges.active')}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-tertiary">{t('badges.inactive')}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-text-secondary">{h.total_helps_completed}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!h.is_verified && !h.suspended_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAction(h.id, 'verify')}
                        className={`p-2 rounded-sm ${adminInteractive.rowHover}`}
                        title={t('actions.verify')}
                      >
                        <ShieldCheck className="w-4 h-4 text-action" />
                      </Button>
                    )}
                    {!h.suspended_at && (
                      <Button
                        variant="destructive-ghost"
                        size="icon"
                        onClick={() => onAction(h.id, 'suspend')}
                        className={`p-2 rounded-sm ${adminInteractive.rowHover}`}
                        title={t('actions.suspend')}
                      >
                        <Ban className="w-4 h-4 text-error-500" />
                      </Button>
                    )}
                    {h.suspended_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAction(h.id, 'reactivate')}
                        className={`p-2 rounded-sm ${adminInteractive.rowHover}`}
                        title={t('actions.reactivate')}
                      >
                        <UserCheck className="w-4 h-4 text-action" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {helpers && helpers.items.length === 0 && (
          <div className="p-8 text-center text-text-tertiary">{t('empty')}</div>
        )}
      </div>

      {helpers && helpers.pagination.total > 50 && (
        <Pagination
          offset={helpOffset}
          setOffset={setHelpOffset}
          hasMore={helpers.pagination.hasMore}
          countLabel={t('countLabel', { count: helpers.pagination.total })}
        />
      )}
    </div>
  )
}

function Pagination({ offset, setOffset, hasMore, countLabel }: { offset: number; setOffset: React.Dispatch<React.SetStateAction<number>>; hasMore: boolean; countLabel: string }) {
  const tPag = useTranslations('admin.pagination')
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-tertiary">{countLabel}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
      </div>
    </div>
  )
}
