'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { ChecklistResult } from '@/config/intake-checklist';
import { INTAKE_STATUS } from '@/config/intake-status';
import Heading from '@/components/admin/AdminHeading';
import { ChecklistGroup } from '../ChecklistGroup';
import type { DetailData } from '../types';

interface IntakeChecklistSectionProps {
  detail: DetailData;
  checklistPendingItems: ReadonlySet<string>;
  onSetChecklistResult: (
    itemId: string,
    result: ChecklistResult | null,
    notes?: string,
    options?: { secondPersonOverride?: boolean },
  ) => void;
  qcGate: boolean;
  publishPrice: number;
  publishing: boolean;
  onStartQc: () => void;
  startingQc: boolean;
  onPublish: (options?: { skipQc?: boolean }) => void;
}

export function IntakeChecklistSection({
  detail,
  checklistPendingItems,
  onSetChecklistResult,
  qcGate,
  publishPrice,
  publishing,
  onStartQc,
  startingQc,
  onPublish,
}: IntakeChecklistSectionProps) {
  const t = useTranslations('admin.intake.detail');
  return (
    <>
      {/* Checklist Groups */}
      <div className="space-y-4">
        {detail.checklist_grouped.map((group) => (
          <ChecklistGroup
            key={`${group.category}-${detail.marketplace_status}`}
            group={group}
            readOnly={detail.marketplace_status === INTAKE_STATUS.PUBLISHED}
            pendingItems={checklistPendingItems}
            onSetResult={onSetChecklistResult}
          />
        ))}
      </div>

      {/* QC gate — quick capture of a device category that requires the
          checklist: no publishing until the workflow is started */}
      {qcGate && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 space-y-3">
          <Heading
            level={3}
            className="font-medium flex items-center gap-2 text-warning-800 dark:text-warning-200"
          >
            <AlertCircle className="w-4 h-4" /> {t('qcGate.heading')}
          </Heading>
          <p className="text-sm text-warning-700 dark:text-warning-200">{t('qcGate.body')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onStartQc}
              disabled={startingQc}
              variant="primary"
              size="sm"
            >
              {startingQc ? t('qcGate.starting') : t('qcGate.start')}
            </Button>
            {/* Same escape hatch as the checklist path: one click, audited,
                listing without Prüfsiegel. */}
            <Button
              type="button"
              onClick={() => onPublish({ skipQc: true })}
              disabled={publishing || publishPrice <= 0}
              variant="outline"
              size="sm"
              title={t('publishUntestedTitle')}
            >
              {publishing ? t('publishing') : t('publishUntested')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
