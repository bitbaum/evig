'use client'

import { useState } from 'react'
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

export function Tabs({ tabs, defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1',
              activeTab === tab.value
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children(activeTab)}</div>
    </div>
  )
}
