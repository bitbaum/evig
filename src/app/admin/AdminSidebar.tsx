'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Store,
  Shield,
  User,
  Brain,
} from 'lucide-react'
import { ORG, ORG_IMAGES } from '@/config/org'
import {
  getSidebarGroupsWithSections,
  getHirnSection,
  isSensitiveSection,
  getSensitivityReason,
  type SidebarGroupId,
} from '@/config/sections'
import { ROUTES } from '@/config/routes'

interface AdminSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  accessibleSections: string[]
  pathname: string
}

export function AdminSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen,
  accessibleSections,
  pathname,
}: AdminSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<SidebarGroupId>>(() => {
    return new Set(['uebersicht', 'angebot', 'inhalte'])
  })

  const groupedSections = getSidebarGroupsWithSections()
  const hirnSection = getHirnSection()
  const hasHirnAccess = hirnSection && accessibleSections.includes(hirnSection.id)

  const toggleGroup = (groupId: SidebarGroupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const groupHasActiveItem = (groupId: SidebarGroupId) => {
    const group = groupedSections.find(g => g.group.id === groupId)
    if (!group) return false
    return group.sections.some(s => isActive(s.path) && accessibleSections.includes(s.id))
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 border-r border-neutral-200 bg-white dark:border-white/[0.06] dark:bg-neutral-900 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-3 dark:border-white/[0.06]">
        {!sidebarCollapsed && (
          <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2.5 min-w-0">
            <Image
              src={ORG_IMAGES.favicon}
              alt={ORG.name}
              width={28}
              height={28}
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              {ORG.name} Admin
            </span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href={ROUTES.admin.dashboard} className="mx-auto">
            <Image
              src={ORG_IMAGES.favicon}
              alt={ORG.name}
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
          </Link>
        )}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-white/[0.06] lg:flex"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          )}
        </button>

        {/* Mobile close — 44×44 to meet thumb-tap minimum on phones */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] lg:hidden"
          aria-label="Seitenleiste schliessen"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin-Navigation" className="mt-1 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {groupedSections.map(({ group, sections }) => {
          const accessibleGroupSections = sections.filter(s => accessibleSections.includes(s.id))
          if (accessibleGroupSections.length === 0) return null

          const isExpanded = expandedGroups.has(group.id)
          const hasActive = groupHasActiveItem(group.id)

          return (
            <div key={group.id} className="mb-2">
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-3 lg:py-1.5 text-xs font-medium uppercase tracking-widest transition-colors ${
                    hasActive
                      ? 'text-primary-500 dark:text-primary-500'
                      : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400'
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}

              {(isExpanded || sidebarCollapsed) && (
                <div className={`space-y-1 ${sidebarCollapsed ? '' : 'mt-1'}`}>
                  {accessibleGroupSections.map(section => {
                    const active = isActive(section.path)
                    const sensitive = isSensitiveSection(section.id)
                    const sensitivityReason = sensitive ? getSensitivityReason(section.id) : undefined
                    const Icon = section.ui.icon

                    return (
                      <Link
                        key={section.path}
                        href={section.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 transition-colors ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${
                          active
                            ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/[0.08] dark:text-primary-400'
                            : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.04] hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title={sidebarCollapsed ? `${section.ui.label}${sensitive ? ' (Geschützt)' : ''}` : sensitivityReason}
                      >
                        {/* Larger icon when collapsed so it's easier to tap and recognise at a glance */}
                        <Icon className={`flex-shrink-0 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'} ${active ? 'text-primary-500 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-600'}`} />
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-sm font-medium flex items-center gap-1.5">
                            {section.ui.label}
                            {sensitive && (
                              <span title={sensitivityReason}>
                                <Shield className="w-3 h-3 text-warning-400" />
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Hirn AI — flat accent, no gradients (matches the rest of the
            design system; gradients are reserved for hero overlays). */}
        {hasHirnAccess && hirnSection && (
          <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-white/[0.06]">
            <Link
              href={hirnSection.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                isActive(hirnSection.path)
                  ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400 ring-1 ring-primary-500/30'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-500/10'
              }`}
              title={sidebarCollapsed ? 'Hirn AI' : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <span className="text-sm font-semibold">Hirn AI</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">KI-Assistent</p>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Website links */}
        <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-white/[0.06]">
          {!sidebarCollapsed && (
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              Website
            </p>
          )}
          <div className="space-y-0.5">
            {[
              { href: '/', icon: Home, label: 'Startseite' },
              { href: '/shop', icon: Store, label: 'Shop' },
              { href: '/dashboard', icon: User, label: 'Mein Bereich' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-600 dark:hover:bg-white/[0.04] dark:hover:text-white ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{label}</span>}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
