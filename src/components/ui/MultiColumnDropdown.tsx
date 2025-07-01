'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useDropdown } from '@/lib/contexts/DropdownContext'
import { NavigationItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

interface MultiColumnDropdownProps {
  id: string
  items: NavigationItem[]
  isMultiColumn?: boolean
  className?: string
}

// Group items by sections for category-based columns
const groupItemsBySection = (items: NavigationItem[]) => {
  const groups: { section: NavigationItem | null; items: NavigationItem[] }[] = []
  let currentSection: NavigationItem | null = null
  let currentItems: NavigationItem[] = []

  items.forEach((item) => {
    if (item.isSection) {
      // Save previous group if exists
      if (currentSection || currentItems.length > 0) {
        groups.push({ section: currentSection, items: [...currentItems] })
      }
      // Start new group
      currentSection = item
      currentItems = []
    } else {
      currentItems.push(item)
    }
  })

  // Add final group
  if (currentSection || currentItems.length > 0) {
    groups.push({ section: currentSection, items: [...currentItems] })
  }

  return groups
}

export function MultiColumnDropdown({ 
  id, 
  items, 
  isMultiColumn = false,
  className = ''
}: MultiColumnDropdownProps) {
  const { openDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave } = useDropdown()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isVisible = openDropdown === id

  if (!isVisible || !items?.length) return null

  const groups = isMultiColumn ? groupItemsBySection(items) : []
  const columnCount = groups.length > 1 ? Math.min(groups.length, 3) : 2
  const useGroupedLayout = isMultiColumn && groups.length > 1

  return (
    <div
      ref={dropdownRef}
      id={`dropdown-${id}`}
      className={cn(
        "absolute top-full mt-1 z-50",
        "bg-white rounded-xl shadow-xl border border-gray-200/60",
        "backdrop-blur-md bg-white/95",
        // Strapi-style smart centering with viewport awareness
        useGroupedLayout ? "w-[800px]" : "w-80",
        "left-1/2 -translate-x-1/2",
        // Viewport-aware adjustment for right-side items
        id === 'get involved' && "transform-none right-0 left-auto",
        className
      )}
      onMouseEnter={handleDropdownMouseEnter}
      onMouseLeave={handleDropdownMouseLeave}
    >
      {useGroupedLayout ? (
        <div className={cn(
          "grid gap-8 p-6",
          columnCount === 3 ? "grid-cols-3" : "grid-cols-2"
        )}>
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3">
              {group.section && (
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  {group.section.name}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                        "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                        "group"
                      )}
                      {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block px-4 py-3 text-sm transition-colors duration-150",
                "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              )}
              {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
            >
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 