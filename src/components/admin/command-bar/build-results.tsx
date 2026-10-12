// Command registry + result-list building for the admin command palette (pure logic, no state).

import { useTranslations } from 'next-intl';
import { Monitor, Vote, FileText, LayoutDashboard, User } from 'lucide-react';
import { rerank, type SearchSpec } from '@bitbaum/searchkit';
import { ROUTES } from '@/config/routes';
import { sectionText, type SectionsT } from '@/lib/section-labels';
import { createListSearch, groupByRank } from '@/lib/search/list-search';
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
// Matching + ranking: @bitbaum/searchkit (one slip per word forgiven, umlauts
// fold, best match first within each group).
// ---------------------------------------------------------------------------

/** Rows shown per server-backed group (the route over-fetches; ranking picks). */
export const ROWS_PER_GROUP = 8;

/** Rank rows the server matched for `q`; rows it cannot place keep their order after. */
function rankRows<T>(rows: readonly T[], q: string, fields: SearchSpec<T>['fields']) {
  return rerank(rows, { fields }, q)
    .slice(0, ROWS_PER_GROUP)
    .map(({ item, hit }) => ({ item, marks: hit?.matches[fields[0]!.name] }));
}

const TITLE_FIELDS: SearchSpec<{ title: string }>['fields'] = [
  { name: 'label', get: (row) => row.title },
];

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

  // Actions and sections are static + small → searched together client-side,
  // the group holding the best hit first. Section labels resolve through the
  // locale (the API returns the canonical German strings).
  const sections: ResultItem[] = (index?.sections ?? []).map((s) => ({
    key: `section-${s.id}`,
    label: sectionText(tSections, s.id, 'label', s.label),
    sub: sectionText(tSections, s.id, 'description', s.description),
    href: s.path,
    icon: <LayoutDashboard className="w-4 h-4" />,
    group: t('groups.sections'),
  }));
  const searchCommands = createListSearch([...actionItems, ...sections], {
    fields: [
      { name: 'label', get: (item) => item.label },
      { name: 'description', get: (item) => item.sub },
    ],
  });
  const items: ResultItem[] = groupByRank(
    searchCommands(q).map(({ item, matches }) => ({ ...item, marks: matches.label })),
    (item) => item.group,
  );

  if (index) {
    // Users / decisions / listings were found server-side for this query
    // (full-table ILIKE, widened with typo corrections) — rank them here.
    const users = rankRows(index.recentUsers, q, [
      { name: 'label', get: (u) => u.name || u.email },
      { name: 'email', get: (u) => u.email },
    ]);
    for (const { item: u, marks } of users) {
      items.push({
        key: `user-${u.id}`,
        label: u.name || u.email,
        marks,
        sub: u.email,
        href: ROUTES.admin.user(u.id),
        icon: <User className="w-4 h-4" />,
        group: t('groups.users'),
      });
    }

    for (const { item: d, marks } of rankRows(index.recentDecisions, q, TITLE_FIELDS)) {
      items.push({
        key: `decision-${d.id}`,
        label: d.title,
        marks,
        sub: d.status,
        href: ROUTES.admin.decision(d.id),
        icon: <Vote className="w-4 h-4" />,
        group: t('groups.decisions'),
      });
    }

    for (const { item: l, marks } of rankRows(index.recentListings, q, TITLE_FIELDS)) {
      items.push({
        key: `listing-${l.id}`,
        label: l.title,
        marks,
        sub: l.status,
        href: `${ROUTES.admin.marketplace}?listing=${l.id}`,
        icon: <Monitor className="w-4 h-4" />,
        group: t('groups.listings'),
      });
    }
  }

  return items;
}
