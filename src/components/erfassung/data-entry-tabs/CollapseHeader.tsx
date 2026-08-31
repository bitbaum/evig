'use client';

/** Collapsible step header for DataEntryTabs — step badge, title, and expand/collapse chevron. */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { QuickEntryState } from './tabs-config';

interface CollapseHeaderProps {
  isCollapsed: boolean;
  quickEntryState: QuickEntryState;
  onToggle: () => void;
}

export function CollapseHeader({ isCollapsed, quickEntryState, onToggle }: CollapseHeaderProps) {
  const t = useTranslations('components.erfassung.dataEntryTabs');

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      className="flex h-auto w-full items-center justify-between rounded-none px-4 py-3 hover:bg-surface-raised sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3 text-left">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-action-text">
          1
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-text-primary">{t('stepTitle')}</span>
          <span className="hidden text-xs font-normal text-text-tertiary sm:block">
            {t('stepDescription')}
          </span>
        </span>
        {isCollapsed && quickEntryState === 'success' && (
          <span className="text-sm text-action">{t('quickEntryFilled')}</span>
        )}
      </div>
      {isCollapsed ? (
        <ChevronDown className="w-5 h-5 text-text-secondary" />
      ) : (
        <ChevronUp className="w-5 h-5 text-text-secondary" />
      )}
    </Button>
  );
}
