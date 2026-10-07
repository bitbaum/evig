// @vitest-environment node
import { developmentProfileFromMap } from 'bip-kit';
import {
  FLEET_MAP_REVALIDATE_SECONDS,
  FLEET_MAP_SLUG,
  FLEET_MAP_URL,
} from '@/config/development-records';
import {
  fetchDevelopmentProfile,
  fleetMapFetcher,
  groupRoadmap,
  milestoneRows,
  roadmapProgress,
  roadmapStatusKey,
} from '@/lib/development-records';

/**
 * The fleet map as Loki serves it once it has ingested evig's ROADMAP.md and
 * CHANGELOG.md — the shape bip-kit's developmentProfileFromMap accepts. The
 * page's data path is: map JSON → profile → groups → cards.
 */
const FLEET_MAP_FIXTURE = {
  generatedAt: '2026-09-28T10:00:00Z',
  projects: [
    {
      slug: 'loki',
      name: 'Loki',
      what: 'Execution layer',
      roadmap: [],
      changelog: [],
    },
    {
      slug: 'evig',
      name: 'evig',
      what: 'Affordable intelligence — good hardware, fair price.',
      roadmap: [
        {
          title: 'Verein in Gründung, said plainly',
          status: 'in progress',
          progress: 60,
          targetDate: null,
          milestones: [
            { title: 'Every public page states "Verein in Gründung"', done: true },
            { title: 'Association registered', done: false },
          ],
          source: 'ROADMAP.md',
        },
        {
          title: 'Promo codes and gift cards at checkout',
          status: 'planned',
          progress: null,
          targetDate: '2026-Q4',
          milestones: [
            { title: 'Promo-code foundation', done: true },
            { title: 'Admin issuance surface', done: false },
            { title: 'Redemption at checkout', done: false },
            { title: 'Gift cards', done: false },
          ],
        },
        {
          title: 'Fleet orders for Vereine and schools',
          status: 'later',
          progress: null,
          targetDate: null,
          milestones: [],
        },
        {
          title: 'Refocus on affordable intelligence',
          status: 'done',
          progress: 100,
          targetDate: null,
          milestones: ['evig repairs renamed to evig technicians'],
        },
        {
          title: 'A bucket the parser kept verbatim',
          status: 'exploring',
          progress: null,
          targetDate: null,
          milestones: [],
        },
      ],
      changelog: [{ date: '2026-06-16', done: 'Fewer clicks, faster paths.' }],
    },
  ],
};

describe('development records — data path from the fleet map', () => {
  it('projects the evig entry out of the map', () => {
    const profile = developmentProfileFromMap(FLEET_MAP_FIXTURE, FLEET_MAP_SLUG);
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe('evig');
    expect(profile!.roadmap).toHaveLength(5);
    expect(profile!.changelog).toEqual([
      { date: '2026-06-16', done: 'Fewer clicks, faster paths.' },
    ]);
  });

  it('returns null for a slug the map does not carry, and for a malformed map', () => {
    expect(developmentProfileFromMap(FLEET_MAP_FIXTURE, 'petvity')).toBeNull();
    expect(developmentProfileFromMap({ projects: 'nope' }, FLEET_MAP_SLUG)).toBeNull();
    expect(developmentProfileFromMap(null, FLEET_MAP_SLUG)).toBeNull();
  });

  it('normalises the bucket-derived statuses and keeps unknown ones verbatim', () => {
    expect(roadmapStatusKey('in progress')).toBe('inProgress');
    expect(roadmapStatusKey('Now')).toBe('inProgress');
    expect(roadmapStatusKey('planned')).toBe('planned');
    expect(roadmapStatusKey('later')).toBe('later');
    expect(roadmapStatusKey('shipped')).toBe('done');
    expect(roadmapStatusKey('exploring')).toBe('other');
    expect(roadmapStatusKey(null)).toBe('other');
  });

  it('groups items in display order, dropping empty buckets, other groups by raw text', () => {
    const profile = developmentProfileFromMap(FLEET_MAP_FIXTURE, FLEET_MAP_SLUG)!;
    const groups = groupRoadmap(profile.roadmap);
    expect(groups.map((g) => g.key)).toEqual(['inProgress', 'planned', 'later', 'done', 'other']);
    expect(groups[4].rawStatus).toBe('exploring');
    expect(groups.map((g) => g.items.length)).toEqual([1, 1, 1, 1, 1]);
    expect(groupRoadmap([])).toEqual([]);
  });

  it('reads progress from the map when present, else derives it from milestones', () => {
    const profile = developmentProfileFromMap(FLEET_MAP_FIXTURE, FLEET_MAP_SLUG)!;
    const [verein, promo, fleet, refocus] = profile.roadmap;
    expect(roadmapProgress(verein)).toBe(60);
    expect(roadmapProgress(promo)).toBe(25);
    expect(roadmapProgress(fleet)).toBeNull();
    expect(roadmapProgress(refocus)).toBe(100);
  });

  it('renders legacy string milestones as not done', () => {
    expect(milestoneRows(['a', { title: 'b', done: true }])).toEqual([
      { title: 'a', done: false },
      { title: 'b', done: true },
    ]);
  });

  it('fetches the map with revalidation instead of no-store, and an 8s timeout', async () => {
    const calls: Array<{ url: string; init: RequestInit & { next?: { revalidate?: number } } }> =
      [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      calls.push({ url: String(input), init: (init ?? {}) as (typeof calls)[number]['init'] });
      return new Response(JSON.stringify(FLEET_MAP_FIXTURE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    try {
      const profile = await fetchDevelopmentProfile();
      expect(profile?.slug).toBe('evig');
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(FLEET_MAP_URL);
      expect(calls[0].init.cache).toBeUndefined();
      expect(calls[0].init.next?.revalidate).toBe(FLEET_MAP_REVALIDATE_SECONDS);
      expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('is null — not a throw — when the map is down', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('gone', { status: 503 }));
    try {
      await expect(fetchDevelopmentProfile()).resolves.toBeNull();
    } finally {
      fetchSpy.mockRestore();
    }
    void fleetMapFetcher;
  });
});
