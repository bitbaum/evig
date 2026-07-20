'use client'

import { useState, useMemo } from 'react'
import { adminInteractive } from '@/lib/admin-ui'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Link as PublicLink } from '@/i18n/navigation'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Store,
  Search,
  Shield,
  User,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ORG, ORG_IMAGES } from '@/config/org'
import {
  getSidebarGroupsWithSections,
  getHirnSection,
  isSensitiveSection,
  getSensitivityReason,
  type SidebarGroupId,
} from '@/config/sections'
import { ROUTES } from '@/config/routes'
import { sectionLabel, groupLabel as localizedGroupLabel } from '@/lib/section-labels'

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
  // Section + group labels resolve through `admin.sections` messages (all
  // locales; DE mirrors the config SSOT, guarded by the parity test) with the
  // config's German string as runtime fallback — see src/lib/section-labels.ts.
  const tSections = useTranslations('admin.sections')
  // Static config — compute once, not every render.
  const groupedSections = useMemo(() => getSidebarGroupsWithSections(), [])
  const hirnSection = getHirnSection()
  const hasHirnAccess = hirnSection && accessibleSections.includes(hirnSection.id)

  // Quick filter — the sidebar carries 30+ destinations across 8 groups;
  // typing beats scanning. Matches label + group label, case/diacritic-light.
  const [filterQuery, setFilterQuery] = useState('')
  const normalizedQuery = filterQuery.trim().toLowerCase()
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return null
    return groupedSections.flatMap(({ group, sections }) => {
      const localizedGroup = localizedGroupLabel(tSections, group)
      return sections
        .filter(s => accessibleSections.includes(s.id))
        .filter(s => (
          sectionLabel(tSections, s).toLowerCase().includes(normalizedQuery) ||
          localizedGroup.toLowerCase().includes(normalizedQuery)
        ))
        .map(s => ({ section: s, groupLabel: localizedGroup }))
    })
  }, [normalizedQuery, groupedSections, accessibleSections, tSections])

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

      {/* Quick filter — hidden when collapsed (no room for an input) */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted z-10" aria-hidden="true" />
            <Input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t('filterPlaceholder')}
              aria-label={t('filterPlaceholder')}
              className="h-8 pl-8 pr-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label={t('navAria')} className="mt-1 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {/* Filtered flat list — replaces the grouped tree while typing */}
        {filteredSections !== null && !sidebarCollapsed && (
          <div className="space-y-1 pb-2">
            {filteredSections.length === 0 && (
              <p className="px-2 py-2 text-sm text-text-muted">{t('filterNoResults')}</p>
            )}
            {filteredSections.map(({ section, groupLabel }) => {
              const Icon = section.ui.icon
              return (
                <Link
                  key={section.path}
                  href={section.path}
                  onClick={() => { setMobileMenuOpen(false); setFilterQuery('') }}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 transition-colors ${
                    isActive(section.path)
                      ? adminInteractive.navActive
                      : `text-text-tertiary ${adminInteractive.rowHoverSubtle} hover:text-text-primary`
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-text-muted dark:text-text-secondary" />
                  <span className="flex-1 text-sm font-medium">
                    {sectionLabel(tSections, section)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">{groupLabel}</span>
                </Link>
              )
            })}
          </div>
        )}

        {(filteredSections === null || sidebarCollapsed) && groupedSections.map(({ group, sections }) => {
          const accessibleGroupSections = sections.filter(s => accessibleSections.includes(s.id))
          if (accessibleGroupSections.length === 0) return null

          const hasActive = groupHasActiveItem(group.id)
          const isExpanded = isGroupOpen(group.id)

          // A group with a single destination (e.g. Analyse, whose reports live
          // one level down on the hub page) renders as a direct link, not a
          // collapsible header with one lonely child — no pointless accordion,
          // no doubled label. isActive() is prefix-based, so the entry stays
          // highlighted on the hub's sub-pages too.
          if (accessibleGroupSections.length === 1) {
            const only = accessibleGroupSections[0]
            const OnlyIcon = only.ui.icon
            const onlyActive = isActive(only.path)
            return (
              <div key={group.id} className="mb-2">
                <Link
                  href={only.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 transition-colors ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    onlyActive
                      ? adminInteractive.navActive
                      : `text-text-tertiary ${adminInteractive.rowHoverSubtle} hover:text-text-primary`
                  }`}
                  title={sidebarCollapsed ? sectionLabel(tSections, only) : undefined}
                >
                  <OnlyIcon className={`shrink-0 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'} ${onlyActive ? 'text-action' : 'text-text-muted dark:text-text-secondary'}`} />
                  {!sidebarCollapsed && <span className="flex-1 text-sm font-medium">{sectionLabel(tSections, only)}</span>}
                </Link>
              </div>
            )
          }

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
                  <span>{localizedGroupLabel(tSections, group)}</span>
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
                        title={sidebarCollapsed ? `${sectionLabel(tSections, section)}${sensitive ? ` (${t('sensitiveLabel')})` : ''}` : sensitivityReason}
                      >
                        {/* Larger icon when collapsed so it's easier to tap and recognise at a glance */}
                        <Icon className={`shrink-0 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'} ${active ? 'text-action' : 'text-text-muted dark:text-text-secondary'}`} />
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-sm font-medium flex items-center gap-1.5">
                            {sectionLabel(tSections, section)}
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
              // `localized`: public pages carry the locale in the URL prefix, so
              // these links must go through the i18n Link to keep the language.
              // /dashboard is a BYPASS_INTL route (cookie locale) — plain Link.
              { href: '/', icon: Home, label: t('linkHome'), localized: true },
              { href: ROUTES.public.marketplace, icon: Store, label: t('linkShop'), localized: true },
              { href: '/dashboard', icon: User, label: t('linkDashboard'), localized: false },
            ].map(({ href, icon: Icon, label, localized }) => {
              const LinkComp = localized ? PublicLink : Link
              return (
              <LinkComp
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
              </LinkComp>
            )})}
          </div>
        </div>
      </nav>
    </div>
  )
}
