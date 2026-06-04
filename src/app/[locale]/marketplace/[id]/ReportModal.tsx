'use client'

import {
  Loader2,
  Check,
  Flag,
} from 'lucide-react'
import { REPORT_REASONS } from '@/config/marketplace'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
          <Check className="w-12 h-12 text-action mx-auto mb-3" aria-hidden="true" />
          <p className="text-action font-medium">{t('sent')}</p>
          <p className="text-sm text-text-tertiary mt-1">{t('sentThanks')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {REPORT_REASONS.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reportReason === r.value
                    ? 'border-action bg-action-muted-muted'
                    : 'border hover:bg-surface-raised'
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
                <span className="text-sm text-text-primary">{r.label}</span>
              </label>
            ))}
          </div>
          <Textarea
            variant="elevated"
            value={reportDetails}
            onChange={e => onReportDetailsChange(e.target.value)}
            placeholder={t('detailsPlaceholder')}
            rows={3}
            className="resize-none mb-4"
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
