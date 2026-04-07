'use client'

import {
  Loader2,
  Check,
  Flag,
} from 'lucide-react'
import { REPORT_REASONS } from '@/config/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'

interface ReportModalProps {
  reportReason: string
  onReportReasonChange: (v: string) => void
  reportDetails: string
  onReportDetailsChange: (v: string) => void
  reportSending: boolean
  reportSent: boolean
  onReport: () => void
  onClose: () => void
}

export function ReportModal({
  reportReason,
  onReportReasonChange,
  reportDetails,
  onReportDetailsChange,
  reportSending,
  reportSent,
  onReport,
  onClose,
}: ReportModalProps) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Inserat melden" size="sm">
      {reportSent ? (
        <div className="text-center py-4">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-green-700 dark:text-green-400 font-medium">Meldung wurde gesendet</p>
          <p className="text-sm text-gray-500 mt-1">Vielen Dank für Ihre Mithilfe.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {REPORT_REASONS.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reportReason === r.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  value={r.value}
                  checked={reportReason === r.value}
                  onChange={e => onReportReasonChange(e.target.value)}
                  className="accent-green-600"
                />
                <span className="text-sm text-gray-900 dark:text-white">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={e => onReportDetailsChange(e.target.value)}
            placeholder="Zusätzliche Details (optional)"
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
          />
          <Button
            onClick={onReport}
            disabled={!reportReason || reportSending}
            variant="destructive"
            className="w-full gap-2"
          >
            {reportSending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Flag className="w-4 h-4" aria-hidden="true" />
            )}
            Melden
          </Button>
        </>
      )}
    </Modal>
  )
}
