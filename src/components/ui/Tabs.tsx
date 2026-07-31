'use client'

import { useState } from 'react'
import { navLinkClass } from '@/lib/design/nav'
import { cn } from '@/lib/utils'

interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultValue: string
  children: (activeTab: string) => React.ReactNode
  className?: string
}

/** Raised-track segmented tab switcher. Active-segment styling comes from
 *  `NAV_STATE.segmented` — don't hand-roll a variant. */
export function Tabs({ tabs, defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={cn('w-full', className)}>
      <div role="tablist" className="flex space-x-1 bg-surface-raised p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={navLinkClass('segmented', activeTab === tab.value)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children(activeTab)}</div>
    </div>
  )
}
