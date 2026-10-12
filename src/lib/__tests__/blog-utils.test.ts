/**
 * Tests for lib/blog-utils.ts — reading time estimation.
 *
 * Mission-relevant: reading time appears on blog posts. If getReadingTime
 * returns 0 for a non-empty post, the UI shows "0 min read". If it
 * returns 1 for an empty string, the estimate is misleading.
 *
 * Behaviors locked:
 *   getReadingTime
 *   - returns 1 for very short content (less than 200 words)
 *   - returns correct ceil for content exceeding one minute
 *   - treats leading/trailing whitespace as empty for word splitting
 *   - returns 1 for a single word
 *   searchBlogPosts (the blog search box)
 *   - title before tags before excerpt; one slip per word still finds the post
 *   - a word inside a compound ("Computerreparatur") still matches, after
 */

import { evaluate, typoCases, words } from '@bitbaum/searchkit';
import { getReadingTime, paginateBlogIndex, searchBlogPosts, slugifyCategory } from '../blog-utils';

describe('getReadingTime', () => {
  it('returns 1 for a single word', () => {
    expect(getReadingTime('Hello')).toBe(1);
  });

  it('returns 1 for content under 200 words', () => {
    // 100-word content → Math.ceil(100/200) = 1
    const words = Array(100).fill('word').join(' ');
    expect(getReadingTime(words)).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const words = Array(200).fill('word').join(' ');
    expect(getReadingTime(words)).toBe(1);
  });

  it('returns 2 for 201 words', () => {
    const words = Array(201).fill('word').join(' ');
    expect(getReadingTime(words)).toBe(2);
  });

  it('returns 5 for a 1000-word article', () => {
    const words = Array(1000).fill('word').join(' ');
    expect(getReadingTime(words)).toBe(5);
  });

  it('returns correct ceiling for non-even multiples', () => {
    // 450 words → Math.ceil(450/200) = Math.ceil(2.25) = 3
    const words = Array(450).fill('word').join(' ');
    expect(getReadingTime(words)).toBe(3);
  });

  it('ignores surrounding whitespace', () => {
    // Content with leading/trailing spaces should not produce extra empty tokens
    const words = '  ' + Array(199).fill('word').join(' ') + '  ';
    expect(getReadingTime(words)).toBe(1);
  });
});

const posts = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe('paginateBlogIndex', () => {
  it('page 1: hero + up to 3 featured + first pageSize latest', () => {
    const r = paginateBlogIndex(posts(20), 1, 5);
    expect(r.heroPost).toBe('p0');
    expect(r.featuredPosts).toEqual(['p1', 'p2', 'p3']);
    expect(r.latestPosts).toEqual(['p4', 'p5', 'p6', 'p7', 'p8']);
    expect(r.latestTotal).toBe(16);
    // 16 latest, 5 on page 1 → 11 remaining → 3 more pages
    expect(r.totalPages).toBe(4);
  });

  it('page 2 continues after page 1 slice with no hero/featured', () => {
    const r = paginateBlogIndex(posts(20), 2, 5);
    expect(r.heroPost).toBeNull();
    expect(r.featuredPosts).toEqual([]);
    expect(r.latestPosts).toEqual(['p9', 'p10', 'p11', 'p12', 'p13']);
  });

  it('last page holds the remainder', () => {
    const r = paginateBlogIndex(posts(20), 4, 5);
    expect(r.latestPosts).toEqual(['p19']);
  });

  it('no post renders twice and nothing is dropped across pages', () => {
    const all = [1, 2, 3, 4].flatMap((p) => paginateBlogIndex(posts(20), p, 5).latestPosts);
    expect(all).toEqual(posts(20).slice(4));
  });

  it('clamps out-of-range and invalid pages', () => {
    expect(paginateBlogIndex(posts(20), 99, 5).currentPage).toBe(4);
    expect(paginateBlogIndex(posts(20), 0, 5).currentPage).toBe(1);
    expect(paginateBlogIndex(posts(20), NaN, 5).currentPage).toBe(1);
  });

  it('few posts → single page, no crash', () => {
    const r = paginateBlogIndex(posts(2), 1, 5);
    expect(r.heroPost).toBe('p0');
    expect(r.featuredPosts).toEqual(['p1']);
    expect(r.latestPosts).toEqual([]);
    expect(r.totalPages).toBe(1);
  });

  it('empty list → empty page', () => {
    const r = paginateBlogIndex([], 1, 5);
    expect(r.heroPost).toBeNull();
    expect(r.totalPages).toBe(1);
  });
});

describe('slugifyCategory', () => {
  it('matches the index page fallback slugification', () => {
    expect(slugifyCategory('Open Source')).toBe('open-source');
    expect(slugifyCategory('Nachhaltigkeit')).toBe('nachhaltigkeit');
  });
});

describe('searchBlogPosts', () => {
  const POSTS = [
    {
      id: 'cafe',
      title: 'Reparatur-Café im Mai',
      excerpt: 'Wir flicken, was kaputt ist.',
      tags: ['Reparatur'],
    },
    {
      id: 'linux',
      title: 'Linux statt Windows: so gelingt der Umstieg',
      excerpt: null,
      tags: ['Open Source'],
    },
    {
      id: 'privacy',
      title: 'Datenschutz auf dem Smartphone',
      excerpt: 'Apps, Tracker, Einstellungen.',
      tags: [],
    },
    {
      id: 'laptops',
      title: 'Warum gebrauchte Laptops die bessere Wahl sind',
      excerpt: 'Geprüft statt neu.',
      tags: ['Nachhaltigkeit'],
    },
    {
      id: 'battery',
      title: 'Akku tauschen beim MacBook',
      excerpt: 'Schritt für Schritt.',
      tags: ['Anleitung'],
    },
    {
      id: 'velo',
      title: 'Velocomputer reparieren',
      excerpt: 'Computerreparatur am Lenker.',
      tags: null,
    },
  ];
  const ids = (q: string) => searchBlogPosts(POSTS, q).map((p) => p.id);

  it('puts a title match before a tag or excerpt match', () => {
    expect(ids('reparatur')).toEqual(['cafe', 'velo']);
  });

  it('forgives one slip per word and folds umlauts', () => {
    expect(ids('reperatur')[0]).toBe('cafe');
    expect(ids('datenshutz')[0]).toBe('privacy');
    expect(ids('nachhaltigkiet')).toEqual(['laptops']);
    expect(ids('cafe')).toEqual(['cafe']);
  });

  it('passes the generated typo suite over the titles at success@1', async () => {
    const cases = typoCases(
      POSTS.map((p) => ({ id: p.id, name: p.title })),
      { fold: words },
    );
    const report = await evaluate(cases, ids);
    expect(cases.length).toBeGreaterThan(500);
    expect(report.misses).toEqual([]);
    expect(report.successAt1).toBe(1);
  });
});
