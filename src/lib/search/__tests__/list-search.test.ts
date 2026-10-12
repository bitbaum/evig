/**
 * Behaviors locked:
 *   createListSearch / searchList
 *   - an empty query is no filter (list order)
 *   - best match first; one slip per word still finds the item
 *   - a word inside a German compound (substring, not a word start) is still
 *     found, after every ranked hit
 *   - match ranges come back for highlighting, typo matches included
 *   peopleSpec (team-member pickers, decision participants, conversations)
 *   - every one-slip misspelling of a realistic name list finds the person first
 */
import { evaluate, typoCases, words } from '@bitbaum/searchkit';
import { createListSearch, peopleSpec, searchList } from '../list-search';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Anna Müller', email: 'anna.mueller@example.ch' },
  { id: 'p2', name: 'Lukas Meier', email: 'lukas@example.ch' },
  { id: 'p3', name: 'Sabine Schneider', email: 'sabine.schneider@example.ch' },
  { id: 'p4', name: 'Reto Brunner', email: 'reto@example.ch' },
  { id: 'p5', name: 'Céline Favre', email: 'celine.favre@example.ch' },
  { id: 'p6', name: 'Marco Rossi', email: 'marco.rossi@example.ch' },
  { id: 'p7', name: 'Jürg Baumann', email: 'juerg@example.ch' },
  { id: 'p8', name: 'Fabienne Keller', email: 'fabienne@example.ch' },
  { id: 'p9', name: 'Thomas Gerber', email: 'thomas.gerber@example.ch' },
  { id: 'p10', name: 'Nadia Huber', email: 'nadia.huber@example.ch' },
  { id: 'p11', name: null, email: 'info@velowerkstatt.ch' },
];

const spec = peopleSpec<Person>(
  (p) => p.name,
  (p) => p.email,
);
const ids = (query: string) => searchList(PEOPLE, spec, query).map((p) => p.id);

describe('createListSearch', () => {
  it('returns every item in list order for an empty query', () => {
    expect(ids('')).toEqual(PEOPLE.map((p) => p.id));
    expect(ids('   ')).toEqual(PEOPLE.map((p) => p.id));
  });

  it('finds a name with one slip, best match first', () => {
    expect(ids('mülller')[0]).toBe('p1');
    expect(ids('Schnieder')[0]).toBe('p3');
    expect(ids('brunenr')[0]).toBe('p4');
  });

  it('folds umlauts and accents both ways', () => {
    expect(ids('mueller')[0]).toBe('p1');
    expect(ids('muller')[0]).toBe('p1');
    expect(ids('celine')[0]).toBe('p5');
    expect(ids('jurg')[0]).toBe('p7');
  });

  it('ranks a match in the name above one in a later field', () => {
    const list = [
      { id: 'mail', name: 'Someone', email: 'gerber@example.ch' },
      { id: 'name', name: 'Thomas Gerber', email: 'tg@example.ch' },
    ];
    expect(searchList(list, spec, 'gerber').map((p) => p.id)).toEqual(['name', 'mail']);
  });

  it('still finds a word inside a German compound, after the ranked hits', () => {
    expect(ids('werkstatt')).toEqual(['p11']);
    const posts = [{ title: 'Computerreparatur' }, { title: 'Reparatur-Café im Mai' }];
    const titles = searchList(
      posts,
      { fields: [{ name: 'title', get: (p) => p.title }] },
      'reparatur',
    );
    expect(titles.map((p) => p.title)).toEqual(['Reparatur-Café im Mai', 'Computerreparatur']);
  });

  it('returns the ranges that matched, typo matches included', () => {
    const [hit] = createListSearch(PEOPLE, spec)('mülller');
    expect(hit!.item.id).toBe('p1');
    expect(hit!.matches.name).toEqual([{ start: 5, end: 11 }]);
  });
});

describe('peopleSpec — one slip in a name still finds the person', () => {
  it('passes the generated typo suite at success@1', async () => {
    const named = PEOPLE.filter((p): p is Person & { name: string } => p.name !== null);
    const cases = typoCases(
      named.map((p) => ({ id: p.id, name: p.name })),
      { fold: words },
    );
    const report = await evaluate(cases, ids);
    expect(cases.length).toBeGreaterThan(300);
    expect(report.misses).toEqual([]);
    expect(report.successAt1).toBe(1);
  });
});
