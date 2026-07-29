'use client';

// Owns the inline cancel-confirmation panel (required cancel reason + confirm/back).

import { DECISION_STATUS, type DecisionStatus } from '@/config/decisions';
import { AdminButton } from '@/components/admin/AdminButton';
import { Textarea } from '@/components/ui/textarea';
import { adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

interface Props {
  cancelReason: string;
  setCancelReason: (value: string) => void;
  setShowCancelInput: (show: boolean) => void;
  onTransition: (
    status: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string }
  ) => Promise<void>;
}

export function CancelConfirmPanel({
  cancelReason,
  setCancelReason,
  setShowCancelInput,
  onTransition,
}: Props) {
  return (
    <div className="mt-3 rounded-md border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-3">
      <label className={cn('mb-1 block', adminType.subTitle)}>
        Grund für Abbruch
      </label>
      <Textarea
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        rows={2}
        className="mb-2"
        placeholder="Warum wird abgebrochen?"
      />
      <div className="flex gap-2">
        <AdminButton
          variant="danger"
          disabled={!cancelReason.trim()}
          onClick={() => {
            if (cancelReason.trim()) {
              onTransition(DECISION_STATUS.CANCELLED, { cancelReason });
              setShowCancelInput(false);
            }
          }}
        >
          Abbrechen bestätigen
        </AdminButton>
        <AdminButton variant="secondary" onClick={() => setShowCancelInput(false)}>
          Zurück
        </AdminButton>
      </div>
    </div>
  );
}
