'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { cn } from '@/lib/utils'
import { ROLES } from '@/lib/constants'

interface ChecklistItem {
  id: string
  label: string
  description: string
  href: string
  completed: boolean
}

interface OnboardingChecklistProps {
  role: string
  emailVerified: boolean
  className?: string
}

const STORAGE_KEY = 'revampit_onboarding_progress'

// Get saved progress from localStorage (safely)
function getSavedProgress(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Role-specific checklist items
const getChecklistItems = (role: string, emailVerified: boolean, completedIds: string[]): ChecklistItem[] => {
  const baseItems: ChecklistItem[] = [
    {
      id: 'verify-email',
      label: 'E-Mail bestätigen',
      description: 'Bestätige deine E-Mail-Adresse für volle Funktionalität',
      href: '/dashboard/profile',
      completed: emailVerified,
    },
    {
      id: 'complete-profile',
      label: 'Profil vervollständigen',
      description: 'Fügen Sie Ihre persönlichen Informationen hinzu',
      href: '/dashboard/profile',
      completed: completedIds.includes('complete-profile'),
    },
  ]

  const customerItems: ChecklistItem[] = [
    {
      id: 'browse-services',
      label: 'Techniker entdecken',
      description: 'Finde lokale Techniker für deine Geräte',
      href: '/techniker',
      completed: completedIds.includes('browse-services'),
    },
    {
      id: 'browse-workshops',
      label: 'Workshops erkunden',
      description: 'Lernen Sie in unseren kostenlosen Workshops',
      href: '/workshops',
      completed: completedIds.includes('browse-workshops'),
    },
  ]

  const repairerItems: ChecklistItem[] = [
    {
      id: 'add-services',
      label: 'Dienstleistungen hinzufügen',
      description: 'Definieren Sie Ihre angebotenen Reparaturdienste',
      href: '/profil/techniker',
      completed: completedIds.includes('add-services'),
    },
    {
      id: 'set-availability',
      label: 'Verfügbarkeit festlegen',
      description: 'Legen Sie Ihre Arbeitszeiten fest',
      href: '/profil/techniker',
      completed: completedIds.includes('set-availability'),
    },
    {
      id: 'upload-certifications',
      label: 'Zertifizierungen hochladen',
      description: 'Zeigen Sie Ihre Qualifikationen',
      href: '/profil/techniker',
      completed: completedIds.includes('upload-certifications'),
    },
  ]

  const sellerItems: ChecklistItem[] = [
    {
      id: 'add-first-product',
      label: 'Erstes Produkt hinzufügen',
      description: 'Listen Sie Ihr erstes refurbished Gerät',
      href: '/marketplace/sell',
      completed: completedIds.includes('add-first-product'),
    },
    {
      id: 'set-payment-method',
      label: 'Zahlungsmethode einrichten',
      description: 'Konfiguriere deine Zahlungsoptionen',
      href: '/dashboard/seller',
      completed: completedIds.includes('set-payment-method'),
    },
    {
      id: 'complete-shop-profile',
      label: 'Shop-Profil vervollständigen',
      description: 'Mach deinen Shop attraktiv',
      href: '/dashboard/seller',
      completed: completedIds.includes('complete-shop-profile'),
    },
  ]

  switch (role) {
    case ROLES.REPAIRER:
      return [...baseItems, ...repairerItems]
    case ROLES.SELLER:
      return [...baseItems, ...sellerItems]
    default:
      return [...baseItems, ...customerItems]
  }
}

export function OnboardingChecklist({ role, emailVerified, className }: OnboardingChecklistProps) {
  // Initialize state with saved progress
  const initialItems = useMemo(() => {
    const savedProgress = getSavedProgress()
    return getChecklistItems(role, emailVerified, savedProgress)
  }, [role, emailVerified])

  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isVisible, setIsVisible] = useState(() => !initialItems.every(item => item.completed))

  // Save progress to localStorage
  const toggleItem = useCallback((itemId: string) => {
    if (itemId === 'verify-email') return // Can't manually toggle email verification

    setItems(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )

      // Save completed IDs to localStorage
      const completedIds = updated
        .filter(item => item.completed && item.id !== 'verify-email')
        .map(item => item.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds))

      return updated
    })
  }, [])

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!isVisible || items.length === 0) return null

  return (
    <div className={cn(
      'bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <div className="text-left">
            <Heading level={3} className="text-sm font-semibold text-neutral-900 dark:text-white">
              Erste Schritte
            </Heading>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {completedCount} von {totalCount} erledigt ({progressPercent}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:block w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-neutral-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          )}
        </div>
      </button>

      {/* Checklist items */}
      {isExpanded && (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                item.completed ? 'bg-neutral-50 dark:bg-neutral-800/50' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
              )}
            >
              <button
                onClick={() => toggleItem(item.id)}
                disabled={item.id === 'verify-email'}
                className={cn(
                  'flex-shrink-0 mt-0.5',
                  item.id === 'verify-email' && 'cursor-default'
                )}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600 hover:text-primary-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    'text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                    item.completed
                      ? 'text-neutral-500 dark:text-neutral-400 line-through'
                      : 'text-neutral-900 dark:text-white'
                  )}
                >
                  {item.label}
                </Link>
                <p className={cn(
                  'text-xs mt-0.5',
                  item.completed
                    ? 'text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer when all completed */}
      {progressPercent === 100 && isExpanded && (
        <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-center">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            Alles erledigt! Du bist startklar.
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
          >
            Checkliste ausblenden
          </button>
        </div>
      )}
    </div>
  )
}
