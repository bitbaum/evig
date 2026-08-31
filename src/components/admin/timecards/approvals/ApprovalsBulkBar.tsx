'use client';

/** Sticky bulk-action bar slice: selection summary, shared note, approve/reject buttons. */

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTimecardIntl } from '@/hooks/useTimecardIntl';

export function ApprovalsBulkBar({
  selectedCount,
  totalSelectedMinutes,
  sharedNote,
  busy,
  onSharedNoteChange,
  onApprove,
  onReject,
}: {
  selectedCount: number;
  totalSelectedMinutes: number;
  sharedNote: string;
  busy: boolean;
  onSharedNoteChange: (note: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations('admin.timecards');
  const { duration } = useTimecardIntl();
  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:rounded-xl border border-strong dark:border-action/30 bg-action-muted/10 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="text-sm font-medium text-action-text">
          {t('queueSelected', { count: selectedCount, duration: duration(totalSelectedMinutes) })}
        </div>
        <Input
          type="text"
          value={sharedNote}
          onChange={(e) => onSharedNoteChange(e.target.value)}
          placeholder={t('queueNotePlaceholder')}
          className="flex-1 min-w-0"
          maxLength={1000}
        />
        <div className="flex gap-2 shrink-0">
          <Button
            variant="primary"
            onClick={onApprove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-700 text-white text-sm font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('queueApproveCount', { count: selectedCount })}
          </Button>
          <Button
            variant="destructive-outline"
            onClick={onReject}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <XCircle className="w-4 h-4" />
            {t('queueReject')}
          </Button>
        </div>
      </div>
    </div>
  );
}
