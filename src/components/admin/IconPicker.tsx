'use client'

/**
 * Icon Picker Component
 *
 * Grid of Lucide icons for admin to select service icons.
 * Uses curated list from service-icons.ts config.
 */

import { useState } from 'react'
import { SERVICE_ICONS } from '@/config/service-icons'
import { Wrench } from 'lucide-react'

interface IconPickerProps {
  value: string | null
  onChange: (iconName: string) => void
  className?: string
}

// Render icon outside of component to avoid "creating component during render"
function RenderIcon({ iconName, className }: { iconName: string | null; className: string }) {
  const iconConfig = iconName ? SERVICE_ICONS[iconName] : null
  const IconComponent = iconConfig?.icon || Wrench
  return <IconComponent className={className} />
}

export function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const iconNames = Object.keys(SERVICE_ICONS)

  const currentLabel = value ? SERVICE_ICONS[value]?.label : 'Wählen...'

  return (
    <div className={`relative ${className}`}>
      {/* Selected icon button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <RenderIcon iconName={value} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-gray-900 dark:text-white">{currentLabel}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{value || 'Kein Icon gewählt'}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown grid */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Icon grid */}
          <div className="absolute z-20 mt-2 w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {iconNames.map((iconName) => {
                const IconComponent = SERVICE_ICONS[iconName].icon
                const label = SERVICE_ICONS[iconName].label
                const isSelected = value === iconName

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName)
                      setIsOpen(false)
                    }}
                    title={label}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded-lg transition-colors
                      ${isSelected
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                      }
                    `}
                  >
                    <IconComponent
                      className={`w-6 h-6 ${isSelected ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}
                    />
                    <span className="text-xs mt-1 text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {label.split('/')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
