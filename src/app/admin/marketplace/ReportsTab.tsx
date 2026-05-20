'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/date-formats'
import { REPORT_REASONS } from '@/config/marketplace'
import { REPORT_STATUS, REPORT_STATUS_LABELS } from '@/config/report-status'
import type { ReportRow, PaginatedResponse } from './types'

function getReportReasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason
}

interface ReportsTabProps {
  reports: PaginatedResponse<ReportRow> | null
  filter: { status: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
  onHandle: (id: string) => void
}

export function ReportsTab({ reports, filter, setFilter, offset, setOffset, onHandle }: ReportsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={filter.status} onChange={e => { setFilter({ status: e.target.value }); setOffset(0) }} className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-900 dark:border-neutral-600">
          <option value={REPORT_STATUS.PENDING}>{REPORT_STATUS_LABELS[REPORT_STATUS.PENDING]}</option>
          <option value={REPORT_STATUS.REVIEWED}>{REPORT_STATUS_LABELS[REPORT_STATUS.REVIEWED]}</option>
          <option value="all">Alle</option>
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-white/[0.06] text-left">
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Inserat</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Grund</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Melder</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Datum</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
              <th className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/[0.04]">
            {reports?.items.map(r => (
              <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50">
                <td className="px-4 py-3">
                  <a href={`/marketplace/${r.listing_id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-900 dark:text-white hover:text-primary-600 flex items-center gap-1">
                    {r.listing_title} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-neutral-500">Verkäufer: {r.seller_name || r.seller_email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{getReportReasonLabel(r.reason)}</span>
                  {r.details && <p className="text-xs text-neutral-500 mt-1 max-w-xs truncate">{r.details}</p>}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{r.reporter_name || r.reporter_email}</td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                <td className="px-4 py-3">
                  {r.status === REPORT_STATUS.PENDING ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200">Offen</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">{r.resolution_action ?? 'Bearbeitet'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.status === REPORT_STATUS.PENDING && (
                    <button
                      onClick={() => onHandle(r.id)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-white/[0.06]"
                    >
                      Bearbeiten
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports && reports.items.length === 0 && (
          <div className="p-8 text-center text-neutral-500">Keine Meldungen gefunden</div>
        )}
      </div>

      {reports && reports.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{reports.pagination.total} Meldungen</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>Zurück</Button>
            <Button variant="outline" size="sm" disabled={!reports.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>Weiter</Button>
          </div>
        </div>
      )}
    </div>
  )
}
