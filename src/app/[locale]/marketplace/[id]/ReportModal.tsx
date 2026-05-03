'use client'

import {
  Loader2,
  Check,
  Flag,
} from 'lucide-react'
import { REPORT_REASONS } from '@/config/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('marketplace.report_modal')
  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="sm">
      {reportSent ? (
        <div className="text-center py-4">
          <Check className="w-12 h-12 text-primary-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-primary-700 dark:text-primary-400 font-medium">{t('sent')}</p>
          <p className="text-sm text-neutral-500 mt-1">{t('sentThanks')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {REPORT_REASONS.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reportReason === r.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  value={r.value}
                  checked={reportReason === r.value}
                  onChange={e => onReportReasonChange(e.target.value)}
                  className="accent-primary-600"
                />
                <span className="text-sm text-neutral-900 dark:text-white">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={e => onReportDetailsChange(e.target.value)}
            placeholder={t('detailsPlaceholder')}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
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
            {t('submit')}
          </Button>
        </>
      )}
    </Modal>
  )
}
