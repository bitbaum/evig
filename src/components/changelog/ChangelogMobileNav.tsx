'use client'

import { Select } from '@/components/ui/select'

interface ChangelogMobileNavProps {
  label: string
  items: { id: string; label: string }[]
}

export function ChangelogMobileNav({ label, items }: ChangelogMobileNavProps) {
  return (
    <nav
      aria-label={label}
      className="border-b border-subtle bg-surface-base lg:hidden"
    >
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <label className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
            {label}
          </span>
          <Select
            className="min-w-0 flex-1 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                window.location.hash = e.target.value
              }
            }}
          >
            <option value="">— {label} —</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </nav>
  )
}
