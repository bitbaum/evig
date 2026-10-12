/**
 * Behaviors locked (the user ⌘K palette — what it finds and in which order):
 *   - nothing typed: four destinations, then everything loaded
 *   - one slip per word still finds a listing, an order, a workshop or a page,
 *     first (generated typo suite over realistic titles, success@1)
 *   - results stay grouped, the group of the best hit first — the palette
 *     renders groups and the arrow keys walk the flat list, so both orders agree
 *   - the "search the marketplace for …" hand-off is always last
 *   - match ranges come back for highlighting
 */
import { evaluate, typoCases, words } from '@bitbaum/searchkit';
import { buildResults, type GroupLabels, type SearchIndex } from '../user-palette-results';

// Pinned destinations, so a renamed page does not move this suite's numbers.
const NAV = [
  ['overview', 'Übersicht'],
  ['listings', 'Meine Inserate'],
  ['orders', 'Bestellungen'],
  ['favorites', 'Favoriten'],
  ['messages', 'Nachrichten'],
  ['profile', 'Mein Profil'],
  ['settings', 'Einstellungen'],
  ['it-hilfe', 'IT-Hilfe anfragen'],
  ['notifications', 'Benachrichtigungen'],
] as const;
vi.mock('@/config/sections', () => ({
  getDashboardSections: () =>
    NAV.map(([id, label]) => ({ id, path: `/dashboard/${id}`, ui: { label } })),
}));

const L: GroupLabels = {
  goTo: 'Gehe zu',
  myListings: 'Meine Inserate',
  myOrders: 'Meine Bestellungen',
  favorites: 'Favoriten',
  marketplace: 'Marktplatz',
  workshops: 'Workshops',
  search: 'Suche',
  marketplaceSearch: (q) => `Marktplatz nach «${q}» durchsuchen`,
  navLabel: (s) => s.ui.label,
};

const INDEX: SearchIndex = {
  myListings: [
    { id: 'l1', title: 'Lenovo ThinkPad T480', status: 'active' },
    { id: 'l2', title: 'Brother Laserdrucker', status: 'draft' },
  ],
  myOrders: [{ id: 'o1', title: 'Apple MacBook Air', status: 'paid' }],
  favorites: [{ id: 'f1', title: 'Fujitsu Monitor 24 Zoll' }],
  marketplace: [
    { id: 'm1', title: 'Samsung Galaxy Tablet', price_chf: '120' },
    { id: 'm2', title: 'Logitech Tastatur kabellos', price_chf: '15' },
    { id: 'm3', title: 'Dell Latitude Laptop', price_chf: '280' },
    { id: 'm4', title: 'Velo-Computer Sigma', price_chf: '20' },
  ],
  workshops: [
    { id: 'w1', slug: 'linux-einsteiger', title: 'Linux für Einsteiger' },
    { id: 'w2', slug: 'smartphone-reparatur', title: 'Smartphone reparieren' },
  ],
};

const run = (query: string) => buildResults(INDEX, query, L);
const keys = (query: string) => run(query).map((r) => r.key);

describe('buildResults (user ⌘K palette)', () => {
  it('shows four destinations and everything loaded before anything is typed', () => {
    const results = run('');
    expect(results.slice(0, 4).every((r) => r.group === L.goTo)).toBe(true);
    expect(results.filter((r) => r.group === L.goTo)).toHaveLength(4);
    expect(results.at(-1)!.key).toBe('ws:w2');
  });

  it('finds what was meant despite one slip, first', () => {
    expect(keys('thinkpda')[0]).toBe('ml:l1');
    expect(keys('mcbook')[0]).toBe('mo:o1');
    expect(keys('tastatru')[0]).toBe('mk:m2');
    expect(keys('linxu')[0]).toBe('ws:w1');
  });

  it('keeps each group together, the best hit’s group first, hand-off last', () => {
    const results = run('laptop');
    const groups = results.map((r) => r.group);
    expect(groups[0]).toBe(L.marketplace);
    const seen = new Set<string>();
    groups.forEach((g, i) => {
      if (i > 0 && g !== groups[i - 1]) {
        expect(seen.has(g)).toBe(false);
      }
      seen.add(g);
    });
    expect(results.at(-1)!.key).toBe('mk-search');
    expect(results.at(-1)!.href).toBe('/marketplace?search=laptop');
  });

  it('returns the ranges to mark, typo matches included', () => {
    const [first] = run('thinkpda');
    expect(first!.marks).toEqual([{ start: 7, end: 15 }]);
  });

  it('passes the generated typo suite at success@1', async () => {
    const titled = [
      ...INDEX.myListings.map((l) => ({ id: `ml:${l.id}`, name: l.title })),
      ...INDEX.myOrders.map((o) => ({ id: `mo:${o.id}`, name: o.title })),
      ...INDEX.favorites.map((f) => ({ id: `fav:${f.id}`, name: f.title })),
      ...INDEX.marketplace.map((m) => ({ id: `mk:${m.id}`, name: m.title })),
      ...INDEX.workshops.map((w) => ({ id: `ws:${w.id}`, name: w.title })),
      ...NAV.map(([id, label]) => ({ id: `nav:${id}`, name: label })),
    ];
    const cases = typoCases(titled, { fold: words });
    const report = await evaluate(cases, keys);
    expect(cases.length).toBeGreaterThan(1500);
    expect(report.misses).toEqual([]); // every case in the top 3
    // The one case not first: "Mein Profil" with the M dropped is "ein
    // profil", and "ein" is how "Einstellungen" starts.
    const notFirst = cases.filter((c) => keys(c.query)[0] !== c.expect[0]).map((c) => c.query);
    expect(notFirst).toEqual(['ein profil']);
  });
});
