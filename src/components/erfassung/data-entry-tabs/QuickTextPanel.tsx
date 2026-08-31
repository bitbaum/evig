'use client';

/** Quick-text entry panel for DataEntryTabs — textarea, AI fill button, manual-entry link, status feedback. */

import { Zap, Loader2, CheckCircle2, AlertCircle, PencilLine, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { QuickEntryState } from './tabs-config';

interface QuickTextPanelProps {
  quickText: string;
  onQuickTextChange: (value: string) => void;
  quickEntryState: QuickEntryState;
  quickEntryError: string | null;
  onSubmit: () => void;
  onManualEntry?: () => void;
}

export function QuickTextPanel({
  quickText,
  onQuickTextChange,
  quickEntryState,
  quickEntryError,
  onSubmit,
  onManualEntry,
}: QuickTextPanelProps) {
  const t = useTranslations('components.erfassung.dataEntryTabs');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Textarea
          value={quickText}
          onChange={(e) => onQuickTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && quickText.trim()) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={t('exampleInput')}
          disabled={quickEntryState === 'loading'}
          rows={3}
          className="resize-none"
        />
        {/* Discoverability: the multi-product path is otherwise invisible —
            you only find it by accidentally pasting several lines. */}
        <p className="flex items-start gap-1.5 text-xs text-text-tertiary">
          <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('multiProductHint')}</span>
        </p>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!quickText.trim() || quickEntryState === 'loading'}
          variant="primary"
          className="w-full sm:w-auto sm:self-end"
        >
          {quickEntryState === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('analyzing')}</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>{t('fillForm')}</span>
            </>
          )}
        </Button>
        {onManualEntry && (
          <Button
            type="button"
            onClick={onManualEntry}
            variant="ghost"
            className="w-full gap-2 text-text-secondary sm:w-auto sm:self-end"
          >
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            <span>{t('manualEntry')}</span>
          </Button>
        )}
      </div>

      {/* Status feedback */}
      {quickEntryState === 'success' && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-action-muted rounded-lg text-action">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{t('dataFilled')}</span>
        </div>
      )}
      {quickEntryState === 'error' && quickEntryError && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-error-50 dark:bg-error-900/20 rounded-lg text-error-700 dark:text-error-400">
          <AlertCircle className="w-5 h-5" />
          <span>{quickEntryError}</span>
        </div>
      )}
    </div>
  );
}
