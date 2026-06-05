// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helpers tab
// ---------------------------------------------------------------------------

import Link from 'next/link'
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
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={helpFilter.status} onChange={e => { setHelpFilter(f => ({ ...f, status: e.target.value })); setHelpOffset(0) }} className="w-auto">
          <option value="all">Alle Techniker</option>
          <option value={HELPER_STATUS.ACTIVE}>{HELPER_STATUS_LABELS[HELPER_STATUS.ACTIVE]}</option>
          <option value={HELPER_STATUS.VERIFIED}>{HELPER_STATUS_LABELS[HELPER_STATUS.VERIFIED]}</option>
          <option value={HELPER_STATUS.SUSPENDED}>{HELPER_STATUS_LABELS[HELPER_STATUS.SUSPENDED]}</option>
        </Select>
        <Select value={helpFilter.canton} onChange={e => { setHelpFilter(f => ({ ...f, canton: e.target.value })); setHelpOffset(0) }} className="w-auto">
          <option value="">Alle Kantone</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface-base rounded-xl border border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Fähigkeiten</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Kanton</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Tarif</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Hilfe</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/4">
            {helpers?.items.map(h => (
              <tr key={h.id} className="hover:bg-surface-raised dark:hover:bg-surface-base/[0.06]/50">
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/admin/users/${h.user_id}`} className="font-medium text-action hover:underline">
                      {h.helper_name || h.helper_email}
                    </Link>
                    {h.accepts_gratis && <span className="ml-1 px-1 py-0.5 text-[10px] rounded-sm bg-action-muted text-action">Gratis</span>}
                    {h.accepts_kulturlegi && <span className="ml-1 px-1 py-0.5 text-[10px] rounded-sm bg-surface-raised text-text-secondary">KulturLegi</span>}
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
                      <StatusBadge variant="error">Gesperrt</StatusBadge>
                    ) : h.is_verified ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action">Verifiziert</span>
                    ) : h.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action">Aktiv</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-tertiary">Inaktiv</span>
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
                        className="p-2 rounded-sm hover:bg-surface-raised dark:hover:bg-surface-base/6"
                        title="Verifizieren"
                      >
                        <ShieldCheck className="w-4 h-4 text-action" />
                      </Button>
                    )}
                    {!h.suspended_at && (
                      <Button
                        variant="destructive-ghost"
                        size="icon"
                        onClick={() => onAction(h.id, 'suspend')}
                        className="p-2 rounded-sm hover:bg-surface-raised dark:hover:bg-surface-base/6"
                        title="Sperren"
                      >
                        <Ban className="w-4 h-4 text-error-500" />
                      </Button>
                    )}
                    {h.suspended_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAction(h.id, 'reactivate')}
                        className="p-2 rounded-sm hover:bg-surface-raised dark:hover:bg-surface-base/6"
                        title="Reaktivieren"
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
          <div className="p-8 text-center text-text-tertiary">Keine Techniker gefunden</div>
        )}
      </div>

      {helpers && helpers.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{helpers.pagination.total} Techniker</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={helpOffset === 0} onClick={() => setHelpOffset(o => Math.max(0, o - 50))}>Zurück</Button>
            <Button variant="outline" size="sm" disabled={!helpers.pagination.hasMore} onClick={() => setHelpOffset(o => o + 50)}>Weiter</Button>
          </div>
        </div>
      )}
    </div>
  )
}
