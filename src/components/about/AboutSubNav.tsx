/**
 * About Section Sub-Navigation Component
 *
 * Provides navigation between about subpages.
 * Used across all about pages for consistent navigation.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Info, BarChart3, Clock } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/about',
    label: 'Über uns',
    icon: <Info className="h-4 w-4" />,
    description: 'Mission & Geschichte'
  },
  {
    href: '/about/impact',
    label: 'Wirkung',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Unsere Zahlen & Fakten'
  }
]

export default function AboutSubNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
