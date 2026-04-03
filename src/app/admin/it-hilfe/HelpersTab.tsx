// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Helpers tab
// ---------------------------------------------------------------------------

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
          <StatsCard label="Aktiv" value={stats.activeHelpers} icon={UserCheck} color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" />
          <StatsCard label="Verifiziert" value={stats.verifiedHelpers} icon={ShieldCheck} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
          <StatsCard label="Total Angebote" value={stats.totalOffers} icon={HelpCircle} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={helpFilter.status} onChange={e => { setHelpFilter(f => ({ ...f, status: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
          <option value="all">Alle Helfer</option>
          <option value={HELPER_STATUS.ACTIVE}>{HELPER_STATUS_LABELS[HELPER_STATUS.ACTIVE]}</option>
          <option value={HELPER_STATUS.VERIFIED}>{HELPER_STATUS_LABELS[HELPER_STATUS.VERIFIED]}</option>
          <option value={HELPER_STATUS.SUSPENDED}>{HELPER_STATUS_LABELS[HELPER_STATUS.SUSPENDED]}</option>
        </select>
        <select value={helpFilter.canton} onChange={e => { setHelpFilter(f => ({ ...f, canton: e.target.value })); setHelpOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600">
          <option value="">Alle Kantone</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fähigkeiten</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Kanton</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tarif</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Hilfe</th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {helpers?.items.map(h => (
              <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{h.helper_name || h.helper_email}</span>
                    {h.accepts_gratis && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700">Gratis</span>}
                    {h.accepts_kulturlegi && <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700">KulturLegi</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(h.skills ?? []).slice(0, 5).map(s => <SkillTag key={s} skillId={s} />)}
                    {(h.skills ?? []).length > 5 && <span className="text-[10px] text-gray-500">+{(h.skills ?? []).length - 5}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{h.location_canton ?? '–'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {h.hourly_rate_cents ? `CHF ${(h.hourly_rate_cents / 100).toFixed(0)}/h` : '–'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {h.suspended_at ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Gesperrt</span>
                    ) : h.is_verified ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Verifiziert</span>
                    ) : h.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Aktiv</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inaktiv</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{h.total_helps_completed}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!h.is_verified && !h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'verify')}
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Verifizieren"
                      >
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                    {!h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'suspend')}
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Sperren"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                    {h.suspended_at && (
                      <button
                        onClick={() => onAction(h.id, 'reactivate')}
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Reaktivieren"
                      >
                        <UserCheck className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {helpers && helpers.items.length === 0 && (
          <div className="p-8 text-center text-gray-500">Keine Helfer gefunden</div>
        )}
      </div>

      {helpers && helpers.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{helpers.pagination.total} Helfer</span>
          <div className="flex gap-2">
            <button disabled={helpOffset === 0} onClick={() => setHelpOffset(o => Math.max(0, o - 50))} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Zurück</button>
            <button disabled={!helpers.pagination.hasMore} onClick={() => setHelpOffset(o => o + 50)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Weiter</button>
          </div>
        </div>
      )}
    </div>
  )
}
