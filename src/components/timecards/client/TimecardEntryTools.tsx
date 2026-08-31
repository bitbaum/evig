'use client';

import { useTranslations } from 'next-intl';
import { AIFormAssist } from '@/components/ai/AIFormAssist';
import { ShiftWidget } from '@/components/timecards/ShiftWidget';
import type { TimecardAIResult } from '../types';
import type { UseTimecardDraftResult } from '../useTimecardDraft';

/** Owns the below-calendar entry tools: the clock-in shift widget and the collapsed AI form assistant. */
export function TimecardEntryTools({
  tc,
  currentData,
}: {
  tc: UseTimecardDraftResult;
  currentData: Record<string, unknown>;
}) {
  const t = useTranslations('admin.timecards');

  return (
    <div className="space-y-3 border-t border-subtle pt-6">
      <ShiftWidget onClockOut={tc.addShiftEntry} />
      <div className="space-y-2">
        <AIFormAssist<TimecardAIResult>
          formType="timecard"
          variant="section"
          currentData={currentData}
          placeholder={t('aiPlaceholder')}
          onFieldsFilled={tc.handleAIFieldsFilled}
        />
        <p className="px-1 text-xs text-text-tertiary">{t('aiExamples')}</p>
      </div>
    </div>
  );
}
