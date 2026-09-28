import { loadDevelopmentProfile, type DevelopmentProfile } from 'bip-kit';
import {
  FLEET_MAP_REVALIDATE_SECONDS,
  FLEET_MAP_SLUG,
  FLEET_MAP_TIMEOUT_MS,
  FLEET_MAP_URL,
} from '@/config/development-records';

/**
 * Development records — data path for the public /roadmap page.
 *
 * Pure helpers here (grouping, status normalisation) are what the unit test
 * covers; the fetch is a thin wrapper around bip-kit's loader with Next's
 * revalidation semantics instead of bip-kit's `cache: "no-store"` default.
 */

export type RoadmapItem = DevelopmentProfile['roadmap'][number];

/** Normalised roadmap buckets, in the order the page shows them. */
export type RoadmapStatusKey = 'inProgress' | 'planned' | 'later' | 'done' | 'other';

export const ROADMAP_STATUS_ORDER: readonly RoadmapStatusKey[] = [
  'inProgress',
  'planned',
  'later',
  'done',
  'other',
];

/**
 * The map derives status from the ROADMAP.md bucket title, so the values are a
 * small known set plus whatever a repo used verbatim. The verbatim ones are
 * grouped under `other` and shown with their own text.
 */
export function roadmapStatusKey(status: string | null | undefined): RoadmapStatusKey {
  const s = (status ?? '').trim().toLowerCase();
  if (['in progress', 'now', 'doing'].includes(s)) return 'inProgress';
  if (['planned', 'next', 'soon'].includes(s)) return 'planned';
  if (['later', 'someday', 'future'].includes(s)) return 'later';
  if (['done', 'shipped', 'delivered'].includes(s)) return 'done';
  return 'other';
}

export interface RoadmapGroup {
  key: RoadmapStatusKey;
  /** The raw status text for `other` groups; null for the known buckets. */
  rawStatus: string | null;
  items: RoadmapItem[];
}

/** Group items by normalised status, in display order, dropping empty buckets. */
export function groupRoadmap(items: readonly RoadmapItem[]): RoadmapGroup[] {
  const known = new Map<RoadmapStatusKey, RoadmapItem[]>();
  const other = new Map<string, RoadmapItem[]>();
  for (const item of items) {
    const key = roadmapStatusKey(item.status);
    if (key === 'other') {
      const raw = (item.status ?? '').trim() || 'other';
      other.set(raw, [...(other.get(raw) ?? []), item]);
    } else {
      known.set(key, [...(known.get(key) ?? []), item]);
    }
  }
  const groups: RoadmapGroup[] = [];
  for (const key of ROADMAP_STATUS_ORDER) {
    if (key === 'other') {
      for (const [raw, list] of other) groups.push({ key, rawStatus: raw, items: list });
    } else {
      const list = known.get(key);
      if (list?.length) groups.push({ key, rawStatus: null, items: list });
    }
  }
  return groups;
}

export interface MilestoneRow {
  title: string;
  done: boolean;
}

/** Legacy string milestones carry no checkbox; they read as not done. */
export function milestoneRows(milestones: RoadmapItem['milestones']): MilestoneRow[] {
  return milestones.map((m) => (typeof m === 'string' ? { title: m, done: false } : m));
}

/**
 * Progress as the page shows it: the map's number when it has one, otherwise
 * derived from the milestones, otherwise null (no bar).
 */
export function roadmapProgress(item: RoadmapItem): number | null {
  if (item.progress != null) return item.progress;
  const rows = milestoneRows(item.milestones);
  if (rows.length === 0) return null;
  return Math.round((rows.filter((r) => r.done).length / rows.length) * 100);
}

/**
 * bip-kit passes `cache: "no-store"` and its own 8s signal. Next's data cache
 * refuses `no-store` together with `revalidate`, so the fetcher drops the cache
 * directive and states the revalidation window and the timeout itself.
 */
export const fleetMapFetcher: typeof fetch = (input, init) => {
  const rest: RequestInit = { ...init };
  delete rest.cache;
  return fetch(input, {
    ...rest,
    signal: AbortSignal.timeout(FLEET_MAP_TIMEOUT_MS),
    next: { revalidate: FLEET_MAP_REVALIDATE_SECONDS },
  });
};

/** evig's development profile from the fleet map; null when the map is unreachable. */
export function fetchDevelopmentProfile(): Promise<DevelopmentProfile | null> {
  return loadDevelopmentProfile(FLEET_MAP_URL, FLEET_MAP_SLUG, fleetMapFetcher);
}
