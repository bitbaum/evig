'use client'

import { useTranslations } from 'next-intl'
import type { TocHeading } from '@/lib/blog-toc'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { navLinkClass } from '@/lib/design/nav'
import { cn } from '@/lib/utils'

interface Props {
  headings: TocHeading[]
}

/**
 * Sticky "on this page" rail for long posts. Highlights the section currently
 * in view via useScrollSpy + NAV_STATE.rail. Rendered only on lg+ screens (the
 * article reads fine without it on narrow viewports).
 */
export default function BlogTableOfContents({ headings }: Props) {
  const t = useTranslations('blog')
  const activeId = useScrollSpy(headings.map((h) => h.id))

  return (
    <aside className="hidden lg:block">
      <nav
        aria-label={t('onThisPage')}
        className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <Eyebrow className="mb-4">{t('onThisPage')}</Eyebrow>
        <ul className="space-y-1 border-l border-subtle">
          {headings.map((h) => {
            const active = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={navLinkClass('rail', active, cn('text-[13px]', h.level === 3 && 'pl-6'))}
                >
                  {h.text}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
