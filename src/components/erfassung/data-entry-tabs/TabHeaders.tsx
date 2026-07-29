'use client'

/** Tab-strip chrome for DataEntryTabs — one button per entry mode, active state highlighted. */

import { Button } from '@/components/ui/button'
import type { EntryMode, TabConfig } from './tabs-config'

interface TabHeadersProps {
  tabs: TabConfig[]
  activeMode: EntryMode
  onSelectMode: (mode: EntryMode) => void
}

export function TabHeaders({ tabs, activeMode, onSelectMode }: TabHeadersProps) {
  return (
    <div className="grid grid-cols-4 border-y border-subtle bg-surface-raised">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          variant="ghost"
          onClick={() => onSelectMode(tab.id)}
          className={`flex h-auto min-w-0 flex-col items-center justify-center gap-1 rounded-none px-1 py-2 text-xs font-medium sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm ${
            activeMode === tab.id
              ? 'border-b-2 border-action bg-surface-base text-action'
              : 'text-text-secondary hover:bg-surface-base hover:text-text-primary'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Button>
      ))}
    </div>
  )
}
