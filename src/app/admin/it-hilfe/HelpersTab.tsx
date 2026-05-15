// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helpers tab
// ---------------------------------------------------------------------------

import Link from 'next/link'
import {
  HelpCircle, UserCheck, ShieldCheck, Ban,
} from 'lucide-react'
import { SWISS_CANTONS } from '@/config/swiss-cantons'
import { HELPER_STATUS, HELPER_STATUS_LABELS } from '@/config/helper-status'
import type { HelperRow, PaginatedResponse, HelperFilter, Stats } from './types'
import { StatsCard, SkillTag } from './shared'

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
      {/* Helper stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Aktiv" value={stats.activeHelpers} icon={UserCheck} color="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200" />
          <StatsCard label="Verifiziert" value={stats.verifiedHelpers} icon={ShieldCheck} color="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800 text-info-800 dark:text-info-200" />
          <StatsCard label="Total Angebote" value={stats.totalOffers} icon={HelpCircle} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={helpFilter.status} onChange={e => { setHelpFilter(f => ({ ...f, status: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="all">Alle Helfer</option>
          <option value={HELPER_STATUS.ACTIVE}>{HELPER_STATUS_LABELS[HELPER_STATUS.ACTIVE]}</option>
          <option value={HELPER_STATUS.VERIFIED}>{HELPER_STATUS_LABELS[HELPER_STATUS.VERIFIED]}</option>
          <option value={HELPER_STATUS.SUSPENDED}>{HELPER_STATUS_LABELS[HELPER_STATUS.SUSPENDED]}</option>
        </select>
        <select value={helpFilter.canton} onChange={e => { setHelpFilter(f => ({ ...f, canton: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-800 dark:border-neutral-600">
          <option value="">Alle Kantone</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left">
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Name</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Fähigkeiten</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Kanton</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Tarif</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Hilfe</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {helpers?.items.map(h => (
              <tr key={h.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/admin/users/${h.user_id}`} className="font-medium text-primary-600 hover:underline">
                      {h.helper_name || h.helper_email}
                    </Link>
                    {h.accepts_gratis && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700">Gratis</span>}
                    {h.accepts_kulturlegi && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-info-100 text-info-700">KulturLegi</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(h.skills ?? []).slice(0, 5).map(s => <SkillTag key={s} skillId={s} />)}
                    {(h.skills ?? []).length > 5 && <span className="text-[10px] text-neutral-500">+{(h.skills ?? []).length - 5}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{h.location_canton ?? '–'}</td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {h.hourly_rate_cents ? `CHF ${(h.hourly_rate_cents / 100).toFixed(0)}/h` : '–'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {h.suspended_at ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-700">Gesperrt</span>
                    ) : h.is_verified ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">Verifiziert</span>
                    ) : h.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-700">Aktiv</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">Inaktiv</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-neutral-600">{h.total_helps_completed}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!h.is_verified && !h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'verify')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        title="Verifizieren"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary-500" />
                      </button>
                    )}
                    {!h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'suspend')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        title="Sperren"
                      >
                        <Ban className="w-4 h-4 text-error-500" />
                      </button>
                    )}
                    {h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'reactivate')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        title="Reaktivieren"
                      >
                        <UserCheck className="w-4 h-4 text-info-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {helpers && helpers.items.length === 0 && (
          <div className="p-8 text-center text-neutral-500">Keine Helfer gefunden</div>
        )}
      </div>

      {helpers && helpers.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{helpers.pagination.total} Helfer</span>
          <div className="flex gap-2">
            <button disabled={helpOffset === 0} onClick={() => setHelpOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
            <button disabled={!helpers.pagination.hasMore} onClick={() => setHelpOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
