/**
 * The homepage "Was es löst" section is a set of claims with addresses. This
 * pins the three ways it can quietly lie: a card whose link goes to a page
 * that does not exist, a card id with no strings (renders the raw key), and a
 * message entry no card renders (copy that drifted away from the config).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROBLEM_SCALES, PROBLEMS_CTA } from '@/config/problems-we-solve';
import de from '../../../messages/de.json';

const APP_DIR = join(__dirname, '..', '..', 'app', '[locale]');

/** A public path resolves when `src/app/[locale]/<path>/page.tsx` exists. */
function pageExists(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/^\/|\/$/g, '');
  return existsSync(join(APP_DIR, path, 'page.tsx'));
}

const items = PROBLEM_SCALES.flatMap((scale) => scale.items);
const messages = de.problems as {
  scales: Record<string, { title?: string; subtitle?: string }>;
  items: Record<string, { problem?: string; solution?: string; cta?: string }>;
};

describe('problems we solve', () => {
  it('has both scales, each with a real handful of cards', () => {
    expect(PROBLEM_SCALES.map((s) => s.id)).toEqual(['people', 'society']);
    for (const scale of PROBLEM_SCALES) {
      expect(scale.items.length).toBeGreaterThanOrEqual(4);
      expect(scale.items.length).toBeLessThanOrEqual(6);
    }
  });

  it('card ids are unique across both scales', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every card and CTA links to a page that exists', () => {
    const hrefs = [...items.map((i) => i.href), ...Object.values(PROBLEMS_CTA)];
    const broken = hrefs.filter((href) => !href.startsWith('/') || !pageExists(href));
    expect(broken).toEqual([]);
  });

  it('every scale and card has its German strings', () => {
    const missing: string[] = [];
    for (const scale of PROBLEM_SCALES) {
      if (!messages.scales[scale.id]?.title) missing.push(`scales.${scale.id}.title`);
      if (!messages.scales[scale.id]?.subtitle) missing.push(`scales.${scale.id}.subtitle`);
    }
    for (const item of items) {
      for (const field of ['problem', 'solution', 'cta'] as const) {
        if (!messages.items[item.id]?.[field]) missing.push(`items.${item.id}.${field}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('no message entry is orphaned from the config', () => {
    const ids = new Set(items.map((i) => i.id));
    expect(Object.keys(messages.items).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('states no figures — numbers belong to their SSOT pages, not this copy', () => {
    const withDigits = items.filter((i) =>
      Object.values(messages.items[i.id] ?? {}).some((s) => /\d/.test(s.replace(/CO₂/g, ''))),
    );
    expect(withDigits.map((i) => i.id)).toEqual([]);
  });
});
