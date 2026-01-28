/**
 * Header utility functions
 */

import type { NavigationItem } from '@/config/navigation'

export interface NavigationGroup {
  section: NavigationItem | null
  items: NavigationItem[]
}

/**
 * Group navigation items by sections for mega menu display
 */
export function groupItemsBySection(items: NavigationItem[]): NavigationGroup[] {
  const groups: NavigationGroup[] = []
  let currentSection: NavigationItem | null = null
  let currentItems: NavigationItem[] = []

  items.forEach((item) => {
    if (item.isSection) {
      if (currentSection || currentItems.length > 0) {
        groups.push({ section: currentSection, items: [...currentItems] })
      }
      currentSection = item
      currentItems = []
    } else {
      currentItems.push(item)
    }
  })

  if (currentSection || currentItems.length > 0) {
    groups.push({ section: currentSection, items: [...currentItems] })
  }

  return groups
}
