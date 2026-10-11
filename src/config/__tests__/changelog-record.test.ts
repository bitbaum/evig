/**
 * evig keeps one changelog in two shapes: CHANGELOG.md, which the fleet map
 * reads (and the public /roadmap links into), and src/config/changelog.ts,
 * which /changelog renders in every language. They are to be updated in the
 * same PR — and they drifted anyway: the file stopped at 0.1.4 while four
 * months shipped. These cases hold them to each other, and hold ROADMAP.md's
 * `{#id}` links to the changelog lines that delivered them.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readRefs } from 'bip-kit';
import { CHANGELOG_RELEASES } from '@/config/changelog';

const read = (name: string) => readFileSync(join(process.cwd(), name), 'utf8');
const lines = (name: string) => read(name).split('\n');

describe('changelog record', () => {
  it('lists the same releases, with the same dates, in both shapes', () => {
    const md = [...read('CHANGELOG.md').matchAll(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/gm)].map(
      (m) => `${m[1]} ${m[2]}`,
    );
    const config = CHANGELOG_RELEASES.map((r) => `${r.version} ${r.date}`);
    expect(config).toEqual(md);
  });

  it('never puts a link token in copy the site renders', () => {
    const copy = CHANGELOG_RELEASES.flatMap((r) => [r.title, ...r.changes]).flatMap((c) => [
      c.de,
      c.en,
    ]);
    expect(copy.filter((text) => text.includes('{#'))).toEqual([]);
  });

  it('every id the changelog cites is declared once on the roadmap', () => {
    const declared = lines('ROADMAP.md')
      .filter((l) => /^###\s|^\s*[-*]\s+\[[ xX]\]\s/.test(l))
      .flatMap((l) => readRefs(l).refs);
    expect(declared.filter((id, i) => declared.indexOf(id) !== i)).toEqual([]);
    const cited = lines('CHANGELOG.md').flatMap((l) => readRefs(l).refs);
    expect(cited.filter((id) => !declared.includes(id))).toEqual([]);
  });

  it('every ticked step with an id is delivered by some changelog line', () => {
    const cited = new Set(lines('CHANGELOG.md').flatMap((l) => readRefs(l).refs));
    const done = lines('ROADMAP.md')
      .filter((l) => /^\s*[-*]\s+\[[xX]\]\s/.test(l))
      .flatMap((l) => readRefs(l).refs);
    expect(done.filter((id) => !cited.has(id))).toEqual([]);
  });
});
