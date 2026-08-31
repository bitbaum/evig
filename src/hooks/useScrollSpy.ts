'use client';

import { useEffect, useState } from 'react';

/**
 * Scroll-spy for TOC rails: returns the id of the section currently in view.
 *
 * Observes the elements with the given ids and reports the topmost one (in
 * `ids` order, which must match document order) intersecting the trigger band
 * near the top of the viewport. Keeps the last known section when none
 * intersects (e.g. inside a tall section whose heading scrolled past), so the
 * highlight never flickers off mid-read. Returns '' until the first section
 * enters view — callers may fall back to their first item.
 *
 * The ONE scroll-spy implementation — pair with `NAV_STATE.rail` +
 * `aria-current="location"` instead of hand-rolling an IntersectionObserver.
 */
export function useScrollSpy(ids: string[], rootMargin = '-80px 0px -60% 0px'): string {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = ids.find((id) => visible.has(id));
        if (current) setActiveId(current);
      },
      { rootMargin },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-observe when the id LIST changes, not the array identity
  }, [ids.join('|'), rootMargin]);

  return activeId;
}
