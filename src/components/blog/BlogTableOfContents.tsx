'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TocHeading } from '@/lib/blog-toc'

interface Props {
  headings: TocHeading[]
}

/**
 * Sticky "on this page" rail for long posts. Highlights the section currently
 * in view via IntersectionObserver. Rendered only on xl+ screens (the article
 * reads fine without it on narrow viewports).
 */
export default function BlogTableOfContents({ headings }: Props) {
  const t = useTranslations('blog')
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the topmost heading currently intersecting the trigger band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  return (
    <aside className="hidden lg:block">
      <nav
        aria-label={t('onThisPage')}
        className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-tertiary">
          {t('onThisPage')}
        </p>
        <ul className="space-y-1 border-l border-subtle">
          {headings.map((h) => {
            const active = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={[
                    '-ml-px block border-l-2 py-1 text-[13px] leading-snug transition-colors',
                    h.level === 3 ? 'pl-6' : 'pl-4',
                    active
                      ? 'border-action font-medium text-text-primary'
                      : 'border-transparent text-text-tertiary hover:border-subtle hover:text-text-secondary',
                  ].join(' ')}
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
