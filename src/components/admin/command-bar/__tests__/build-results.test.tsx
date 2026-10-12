/**
 * Behaviors locked (the admin ⌘K palette):
 *   - nothing typed: the action commands only
 *   - one slip per word still finds an action or an admin section, first
 *     (generated typo suite over realistic labels)
 *   - rows the server found (users, decisions, listings) are ranked by what
 *     was typed and capped per group; rows it cannot place keep their order after
 *   - actions and sections: the group of the best hit first; then users,
 *     decisions, listings
 */
import { evaluate, typoCases, words } from '@bitbaum/searchkit';
import type { SectionsT } from '@/lib/section-labels';
import { buildResults, ROWS_PER_GROUP, type CommandBarT } from '../build-results';
import type { SearchIndex } from '../types';

const MESSAGES: Record<string, string> = {
  'actions.newDevice': 'Neues Gerät erfassen',
  'actions.newDecision': 'Neue Entscheidung',
  'actions.newProtocol': 'Neues Protokoll',
  'actions.dashboard': 'Dashboard',
  'groups.actions': 'Aktionen',
  'groups.sections': 'Bereiche',
  'groups.users': 'Benutzer',
  'groups.decisions': 'Entscheide',
  'groups.listings': 'Inserate',
};
const t = Object.assign((key: string) => MESSAGES[key] ?? key, {
  has: () => true,
}) as unknown as CommandBarT;
// No translations: sections fall back to the canonical German the API sends.
const tSections = Object.assign(() => '', { has: () => false }) as unknown as SectionsT;

const SECTIONS: SearchIndex['sections'] = [
  ['intake', 'Geräte-Eingang', 'Neue Geräte erfassen und prüfen'],
  ['marketplace', 'Inserate', 'Marktplatz-Inserate verwalten'],
  ['it-hilfe', 'IT-Hilfe', 'Anfragen und Techniker'],
  ['locations', 'Standorte', 'Abholorte und Werkstätten'],
  ['reviews', 'Bewertungen', 'Bewertungen moderieren'],
  ['presentations', 'Präsentationen', 'Foliensätze für Anlässe'],
  ['approvals', 'Freigaben', 'Inhalte freigeben'],
  ['memberships', 'Mitgliedschaften', 'Mitglieder und Beiträge'],
  ['tasks', 'Aufgaben', 'Wer macht was bis wann'],
  ['protocols', 'Protokolle', 'Sitzungsprotokolle'],
  ['time', 'Zeiterfassung', 'Arbeitszeit und Absenzen'],
].map(([id, label, description]) => ({
  id: id!,
  label: label!,
  description: description!,
  path: `/admin/${id}`,
}));

const index = (over: Partial<SearchIndex> = {}): SearchIndex => ({
  sections: SECTIONS,
  recentUsers: [],
  recentDecisions: [],
  recentListings: [],
  ...over,
});

const keys = (query: string, idx = index()) =>
  buildResults(idx, query, t, tSections).map((r) => r.key);

describe('buildResults (admin ⌘K palette)', () => {
  it('shows only the action commands before anything is typed', () => {
    expect(keys('')).toEqual(['cmd-erfassung', 'cmd-decision', 'cmd-protocol', 'cmd-dashboard']);
  });

  it('finds actions and sections despite one slip', () => {
    expect(keys('protokol')).toEqual(['section-protocols', 'cmd-protocol']);
    expect(keys('neues protokol')[0]).toBe('cmd-protocol');
    expect(keys('zeiterfasung')[0]).toBe('section-time');
    expect(keys('praesentationen')[0]).toBe('section-presentations');
    expect(keys('bewertugnen')[0]).toBe('section-reviews');
  });

  it('passes the generated typo suite over action and section labels', async () => {
    const named = [
      ...Object.entries({
        'cmd-erfassung': 'Neues Gerät erfassen',
        'cmd-decision': 'Neue Entscheidung',
        'cmd-protocol': 'Neues Protokoll',
      }).map(([id, name]) => ({ id, name })),
      ...SECTIONS.map((s) => ({ id: `section-${s.id}`, name: s.label })),
    ];
    const cases = typoCases(named, { fold: words });
    const report = await evaluate(cases, (q) => keys(q));
    expect(cases.length).toBeGreaterThan(300);
    expect(report.misses).toEqual([]);
    expect(report.successAt1).toBe(1);
  });

  it('ranks the rows the server found and caps each group', () => {
    const recentUsers = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `u${i}`,
        name: `Hanna Müller ${i}`,
        email: `h${i}@example.ch`,
      })),
      { id: 'hans', name: 'Hans Müller', email: 'hans@example.ch' },
    ];
    const results = buildResults(index({ recentUsers }), 'hans mülller', t, tSections);
    const users = results.filter((r) => r.group === 'Benutzer');
    expect(users).toHaveLength(ROWS_PER_GROUP);
    expect(users[0]!.key).toBe('user-hans');
    expect(users[0]!.marks).toEqual([
      { start: 0, end: 4 },
      { start: 5, end: 11 },
    ]);
  });

  it('keeps rows it cannot place after the ranked ones, in server order', () => {
    const recentListings = [
      { id: 'mid', title: 'Computerreparatur-Set', status: 'active' },
      { id: 'start', title: 'Reparatur-Kit iPhone', status: 'active' },
    ];
    expect(keys('reparatur', index({ recentListings }))).toEqual(['listing-start', 'listing-mid']);
  });

  it('puts the group of the best command hit first, then users, decisions, listings', () => {
    const results = buildResults(
      index({
        recentUsers: [{ id: 'u', name: 'Pia Protokoll', email: 'pia@example.ch' }],
        recentDecisions: [{ id: 'd', title: 'Protokolle digital ablegen', status: 'open' }],
        recentListings: [{ id: 'l', title: 'Protokoll-Drucker', status: 'active' }],
      }),
      'protokolle',
      t,
      tSections,
    );
    expect([...new Set(results.map((r) => r.group))]).toEqual([
      'Bereiche',
      'Aktionen',
      'Benutzer',
      'Entscheide',
      'Inserate',
    ]);
  });
});
