// Command registry + result-list building for the admin command palette (pure logic, no state).

import { useTranslations } from 'next-intl';
import { Monitor, Vote, FileText, LayoutDashboard, User } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { sectionText, type SectionsT } from '@/lib/section-labels';
import type { SearchIndex, ResultItem } from './types';

// ---------------------------------------------------------------------------
// Action commands (always available) — structure here, labels from messages
// (`admin.commandBar.actions.*`) so the palette follows the admin locale.
// ---------------------------------------------------------------------------

const ACTION_COMMANDS = [
  {
    key: 'cmd-erfassung',
    labelKey: 'actions.newDevice',
    href: ROUTES.admin.intakeCapture,
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    key: 'cmd-decision',
    labelKey: 'actions.newDecision',
    href: ROUTES.admin.decisionNew,
    icon: <Vote className="w-4 h-4" />,
  },
  {
    key: 'cmd-protocol',
    labelKey: 'actions.newProtocol',
    href: ROUTES.admin.protocolNew,
    icon: <FileText className="w-4 h-4" />,
  },
  {
    key: 'cmd-dashboard',
    labelKey: 'actions.dashboard',
    href: ROUTES.admin.dashboard,
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
] as const;

// ---------------------------------------------------------------------------
// Simple substring search (no extra dependency)
// ---------------------------------------------------------------------------

function matches(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

export type CommandBarT = ReturnType<typeof useTranslations<'admin.commandBar'>>;

export function buildResults(
  index: SearchIndex | null,
  query: string,
  t: CommandBarT,
  tSections: SectionsT,
): ResultItem[] {
  const q = query.trim();

  const actionItems: ResultItem[] = ACTION_COMMANDS.map((a) => ({
    key: a.key,
    label: t(a.labelKey),
    href: a.href,
    icon: a.icon,
    group: t('groups.actions'),
  }));

  // No query → show only action commands
  if (!q) return actionItems;

  const items: ResultItem[] = [];

  if (index) {
    // Sections are static + small → filtered client-side. Labels resolve
    // through the locale (the API returns the canonical German strings).
    for (const s of index.sections) {
      const label = sectionText(tSections, s.id, 'label', s.label);
      const description = sectionText(tSections, s.id, 'description', s.description);
      if (matches(label, q) || matches(description, q)) {
        items.push({
          key: `section-${s.id}`,
          label,
          sub: description,
          href: s.path,
          icon: <LayoutDashboard className="w-4 h-4" />,
          group: t('groups.sections'),
        });
      }
    }

    // Users / decisions / listings are already matched server-side for the
    // current query (full-table ILIKE) — show them as-is, no client re-filter.
    for (const u of index.recentUsers) {
      items.push({
        key: `user-${u.id}`,
        label: u.name || u.email,
        sub: u.email,
        href: ROUTES.admin.user(u.id),
        icon: <User className="w-4 h-4" />,
        group: t('groups.users'),
      });
    }

    for (const d of index.recentDecisions) {
      items.push({
        key: `decision-${d.id}`,
        label: d.title,
        sub: d.status,
        href: ROUTES.admin.decision(d.id),
        icon: <Vote className="w-4 h-4" />,
        group: t('groups.decisions'),
      });
    }

    for (const l of index.recentListings) {
      items.push({
        key: `listing-${l.id}`,
        label: l.title,
        sub: l.status,
        href: `${ROUTES.admin.marketplace}?listing=${l.id}`,
        icon: <Monitor className="w-4 h-4" />,
        group: t('groups.listings'),
      });
    }
  }

  // Action commands are always client-filtered.
  const matchedActions = actionItems.filter((a) => matches(a.label, q));

  return [...matchedActions, ...items];
}
