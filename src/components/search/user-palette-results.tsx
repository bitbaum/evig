// What the user ⌘K palette finds and in which order (pure logic, no state).

import type { ReactNode } from 'react';
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Heart,
  Package,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { getDashboardSections } from '@/config/sections';
import { createListSearch, groupByRank, type Range } from '@/lib/search/list-search';

interface IdTitleStatus {
  id: string;
  title: string;
  status?: string;
}

export interface SearchIndex {
  myListings: IdTitleStatus[];
  myOrders: IdTitleStatus[];
  favorites: { id: string; title: string }[];
  marketplace: { id: string; title: string; price_chf?: string | number }[];
  workshops: { id: string; slug?: string; title: string }[];
}

export interface ResultItem {
  key: string;
  label: string;
  /** What matched in `label`, for <SearchHighlight>. */
  marks?: Range[];
  sub?: string;
  href: string;
  icon: ReactNode;
  group: string;
}

export interface GroupLabels {
  goTo: string;
  myListings: string;
  myOrders: string;
  favorites: string;
  marketplace: string;
  workshops: string;
  search: string;
  marketplaceSearch: (query: string) => string;
  navLabel: (s: ReturnType<typeof getDashboardSections>[number]) => string;
}

/** Destinations shown before anything is typed, so data results stay visible. */
const NAV_WITHOUT_QUERY = 4;

function navItems(L: GroupLabels): ResultItem[] {
  return getDashboardSections().map((s) => ({
    key: `nav:${s.id}`,
    label: L.navLabel(s),
    href: s.path,
    group: L.goTo,
    icon: <Compass className="h-4 w-4" />,
  }));
}

function dataItems(index: SearchIndex, L: GroupLabels): ResultItem[] {
  return [
    ...index.myListings.map((l) => ({
      key: `ml:${l.id}`,
      label: l.title,
      sub: l.status,
      href: `/marketplace/${l.id}`,
      group: L.myListings,
      icon: <Package className="h-4 w-4" />,
    })),
    ...index.myOrders.map((o) => ({
      key: `mo:${o.id}`,
      label: o.title,
      sub: o.status,
      href: `/dashboard/orders/${o.id}`,
      group: L.myOrders,
      icon: <ShoppingBag className="h-4 w-4" />,
    })),
    ...index.favorites.map((f) => ({
      key: `fav:${f.id}`,
      label: f.title,
      href: `/marketplace/${f.id}`,
      group: L.favorites,
      icon: <Heart className="h-4 w-4" />,
    })),
    ...index.marketplace.map((m) => ({
      key: `mk:${m.id}`,
      label: m.title,
      sub: m.price_chf != null ? `CHF ${m.price_chf}` : undefined,
      href: `/marketplace/${m.id}`,
      group: L.marketplace,
      icon: <Store className="h-4 w-4" />,
    })),
    ...index.workshops.map((w) => ({
      key: `ws:${w.id}`,
      label: w.title,
      href: `/workshops/${w.slug ?? w.id}`,
      group: L.workshops,
      icon: <GraduationCap className="h-4 w-4" />,
    })),
  ];
}

export function buildResults(
  index: SearchIndex | null,
  query: string,
  L: GroupLabels,
): ResultItem[] {
  const q = query.trim();
  const nav = navItems(L);
  const data = index ? dataItems(index, L) : [];
  if (!q) return [...nav.slice(0, NAV_WITHOUT_QUERY), ...data];

  // One slip per word is forgiven ("bestelungen" → Bestellungen, "thinkpda"
  // → ThinkPad), umlauts fold, and the best match leads whatever its group
  // (groups stay together: the palette renders them, arrow keys walk the list).
  const search = createListSearch([...nav, ...data], {
    fields: [{ name: 'label', get: (item) => item.label }],
  });
  const ranked = search(q).map(({ item, matches }) => ({ ...item, marks: matches.label }));

  // Hand-off: full marketplace search for the typed query.
  return [
    ...groupByRank(ranked, (item) => item.group),
    {
      key: 'mk-search',
      label: L.marketplaceSearch(q),
      href: `/marketplace?search=${encodeURIComponent(q)}`,
      group: L.search,
      icon: <ArrowRight className="h-4 w-4" />,
    },
  ];
}
