'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-surface-raised hover:bg-surface-raised dark:hover:bg-surface-base/6 transition-colors"
      >
        <Heading level={3} className="text-lg text-text-primary">{title}</Heading>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-tertiary" />
        )}
      </button>
      {isOpen && <div className="p-6 space-y-4">{children}</div>}
    </section>
  )
}
