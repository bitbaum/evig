'use client';

// Owns the inline close-confirmation panel (optional outcome summary + confirm/back).

import { DECISION_STATUS, type DecisionStatus } from '@/config/decisions';
import { AdminButton } from '@/components/admin/AdminButton';
import { Textarea } from '@/components/ui/textarea';
import { adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

interface Props {
  closeSummary: string;
  setCloseSummary: (value: string) => void;
  setShowCloseInput: (show: boolean) => void;
  onTransition: (
    status: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string }
  ) => Promise<void>;
}

export function CloseConfirmPanel({
  closeSummary,
  setCloseSummary,
  setShowCloseInput,
  onTransition,
}: Props) {
  return (
    <div className="mt-3 rounded-md border border-strong bg-action-muted p-3">
      <label className={cn('mb-1 block', adminType.subTitle)}>
        Zusammenfassung (optional)
      </label>
      <Textarea
        value={closeSummary}
        onChange={(e) => setCloseSummary(e.target.value)}
        rows={2}
        className="mb-2"
        placeholder="Zusammenfassung des Ergebnisses..."
      />
      <div className="flex gap-2">
        <AdminButton
          variant="primary"
          onClick={() => {
            onTransition(DECISION_STATUS.CLOSED, { outcomeSummary: closeSummary || undefined });
            setShowCloseInput(false);
          }}
        >
          Bestätigen
        </AdminButton>
        <AdminButton variant="secondary" onClick={() => setShowCloseInput(false)}>
          Zurück
        </AdminButton>
      </div>
    </div>
  );
}
