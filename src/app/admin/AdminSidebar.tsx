'use client'

import { useState, useMemo } from 'react'
import { adminInteractive } from '@/lib/admin-ui'
import { useTranslations } from 'next-intl'
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
import { Button } from '@/components/ui/button'
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
  const t = useTranslations('admin.sidebar')
  const tLabels = useTranslations('admin.sectionLabels')
  // Helper: prefer the i18n label, fall back to the SSOT DE label when
  // a section hasn't been translated yet. next-intl throws on missing
  // keys, so we have to catch.
  const labelFor = (id: string, fallback: string): string => {
    try { return tLabels(id as never) || fallback } catch { return fallback }
  }
  // Static config — compute once, not every render.
  const groupedSections = useMemo(() => getSidebarGroupsWithSections(), [])
  const hirnSection = getHirnSection()
  const hasHirnAccess = hirnSection && accessibleSections.includes(hirnSection.id)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const groupHasActiveItem = (groupId: SidebarGroupId) => {
    const group = groupedSections.find(g => g.group.id === groupId)
    if (!group) return false
    return group.sections.some(s => isActive(s.path) && accessibleSections.includes(s.id))
  }

  // User-controlled open groups (manual toggles). The group containing the
  // active route is ALWAYS shown open via isGroupOpen() below — derived during
  // render, so navigating never mutates state (no double-render) nor surprises
  // the user by re-expanding a group they collapsed.
  const [expandedGroups, setExpandedGroups] = useState<Set<SidebarGroupId>>(
    () => new Set<SidebarGroupId>(['uebersicht', 'angebot', 'inhalte']),
  )

  const isGroupOpen = (groupId: SidebarGroupId) =>
    expandedGroups.has(groupId) || groupHasActiveItem(groupId)

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

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 border-r border bg-surface-base transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between border-b border px-3">
        {!sidebarCollapsed && (
          <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2.5 min-w-0">
            <Image
              src={ORG_IMAGES.favicon}
              alt={ORG.name}
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="text-sm font-bold text-text-primary tracking-tight">
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${adminInteractive.rowHover} lg:flex`}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-text-muted" />
          )}
        </Button>

        {/* Mobile close — 44×44 to meet thumb-tap minimum on phones */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${adminInteractive.rowHover} lg:hidden`}
          aria-label={t('closeAria')}
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </Button>
      </div>

      {/* Navigation */}
      <nav aria-label={t('navAria')} className="mt-1 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {groupedSections.map(({ group, sections }) => {
          const accessibleGroupSections = sections.filter(s => accessibleSections.includes(s.id))
          if (accessibleGroupSections.length === 0) return null

          const hasActive = groupHasActiveItem(group.id)
          const isExpanded = isGroupOpen(group.id)

          return (
            <div key={group.id} className="mb-2">
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-3 lg:py-1.5 text-xs font-medium uppercase tracking-widest transition-colors ${
                    hasActive
                      ? 'text-action'
                      : 'text-text-muted dark:text-text-secondary hover:text-text-secondary dark:hover:text-text-muted'
                  }`}
                >
                  <span>{labelFor(group.id, group.label)}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </Button>
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
                            ? adminInteractive.navActive
                            : `text-text-tertiary ${adminInteractive.rowHoverSubtle} hover:text-text-primary`
                        }`}
                        title={sidebarCollapsed ? `${labelFor(section.id, section.ui.label)}${sensitive ? ` (${t('sensitiveLabel')})` : ''}` : sensitivityReason}
                      >
                        {/* Larger icon when collapsed so it's easier to tap and recognise at a glance */}
                        <Icon className={`shrink-0 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'} ${active ? 'text-action' : 'text-text-muted dark:text-text-secondary'}`} />
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-sm font-medium flex items-center gap-1.5">
                            {labelFor(section.id, section.ui.label)}
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
          <div className="mt-4 border-t border pt-4">
            <Link
              href={hirnSection.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                isActive(hirnSection.path)
                  ? 'bg-action/10 text-action ring-1 ring-action/30'
                  : 'text-text-secondary hover:bg-action/10'
              }`}
              title={sidebarCollapsed ? t('hirnTitle') : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-action flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <span className="text-sm font-semibold">{t('hirnTitle')}</span>
                  <p className="text-xs text-text-secondary">{t('hirnSubtitle')}</p>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Website links */}
        <div className="mt-4 border-t border pt-3">
          {!sidebarCollapsed && (
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-widest text-text-muted dark:text-text-secondary">
              {t('websiteGroup')}
            </p>
          )}
          <div className="space-y-0.5">
            {[
              { href: '/', icon: Home, label: t('linkHome') },
              { href: ROUTES.public.marketplace, icon: Store, label: t('linkShop') },
              { href: '/dashboard', icon: User, label: t('linkDashboard') },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 text-text-muted transition-colors ${adminInteractive.rowHoverSubtle} hover:text-text-primary dark:text-text-secondary ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{label}</span>}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
