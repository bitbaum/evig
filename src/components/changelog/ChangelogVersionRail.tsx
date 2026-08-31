'use client';

import { Eyebrow } from '@/components/ui/Eyebrow';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { navLinkClass } from '@/lib/design/nav';

interface ChangelogVersionRailProps {
  label: string;
  items: { id: string; label: string }[];
}

/**
 * Sticky left-rail version index — useScrollSpy + NAV_STATE.rail highlight the
 * release currently in view (same rail treatment as the blog TOC).
 */
export function ChangelogVersionRail({ label, items }: ChangelogVersionRailProps) {
  const activeId = useScrollSpy(items.map((item) => item.id)) || items[0]?.id;

  return (
    <nav aria-label={label} className="ui-public-toc-rail hidden lg:block">
      <Eyebrow className="mb-3">{label}</Eyebrow>
      <ul className="space-y-1 border-l border-subtle">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'location' : undefined}
                className={navLinkClass('rail', active, 'font-mono text-xs')}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
