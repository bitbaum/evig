import { cn } from '@/lib/utils'

/**
 * Semantic heading component.
 *
 * variant="admin"  → compact scale for admin/dashboard UIs (default for admin pages)
 * variant="site"   → large responsive scale for the public marketing site
 *
 * All sizes can be overridden with `className`.
 */

const adminScale = {
  1: 'text-xl font-semibold',      // 20px — page title
  2: 'text-sm font-semibold',      // 14px — card / section header
  3: 'text-sm font-medium',        // 14px — sub-heading inside a card
  4: 'text-xs font-medium uppercase tracking-wide', // 12px — table headers, meta labels
} as const

const siteScale = {
  1: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold',
  2: 'text-2xl sm:text-3xl md:text-4xl font-bold',
  3: 'text-xl sm:text-2xl font-bold',
  4: 'text-lg sm:text-xl md:text-2xl font-bold',
} as const

const tagMap = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const

type HeadingProps = {
  level: 1 | 2 | 3 | 4
  /** "admin" = compact scale (default). "site" = public marketing scale. */
  variant?: 'admin' | 'site'
  children: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLHeadingElement>, 'children'>

export default function Heading({
  level,
  variant = 'admin',
  children,
  className,
  ...props
}: HeadingProps) {
  const Tag = tagMap[level]
  const base = variant === 'site' ? siteScale[level] : adminScale[level]
  return (
    <Tag className={cn(base, className)} {...props}>
      {children}
    </Tag>
  )
}
