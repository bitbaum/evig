import { cn } from '@/lib/utils'

/**
 * Semantic heading component — single source of truth for type scale.
 *
 *   variant="display" → x.ai-style hero display type (huge, tight tracking)
 *   variant="site"    → standard public-marketing scale
 *   variant="admin"   → compact scale for admin/dashboard UIs
 *
 * All sizes can be overridden with `className`.
 *
 * Why three scales: hero sections need DRAMATIC type that doesn't fit
 * "site" (which has to be reasonable for h2/h3 throughout a page).
 * "display" is opt-in for the one or two headlines per page that
 * should land like a billboard. Don't sprinkle display level=1 in
 * the middle of content — that's noise.
 */

const adminScale = {
  1: 'text-xl font-semibold',      // 20px — page title
  2: 'text-sm font-semibold',      // 14px — card / section header
  3: 'text-sm font-medium',        // 14px — sub-heading inside a card
  4: 'text-xs font-medium uppercase tracking-wide', // 12px — table headers, meta labels
} as const

const siteScale = {
  1: 'text-3xl sm:text-4xl md:text-4xl font-semibold',
  2: 'text-2xl sm:text-3xl font-semibold',
  3: 'text-xl sm:text-2xl font-semibold',
  4: 'text-lg sm:text-xl font-semibold',
} as const

// True display: huge, tight, confident. Reserved for one headline per page.
const displayScale = {
  1: 'text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05]',
  2: 'text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1]',
  3: 'text-2xl sm:text-3xl font-semibold',
  4: 'text-xl sm:text-2xl font-semibold',
} as const

const tagMap = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const

export type HeadingProps = {
  level: 1 | 2 | 3 | 4
  /** Type scale variant. "site" = default public scale. */
  variant?: 'admin' | 'site' | 'display'
  children: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'>

export default function Heading({
  level,
  variant = 'site',
  children,
  className,
  ...props
}: HeadingProps) {
  const Tag = tagMap[level]
  const base =
    variant === 'display' ? displayScale[level]
    : variant === 'site' ? siteScale[level]
    : adminScale[level]
  return (
    <Tag className={cn(base, className)} {...props}>
      {children}
    </Tag>
  )
}
