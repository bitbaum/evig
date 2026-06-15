import { LucideIcon } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { DESIGN_TOKENS, ThemeKey } from '@/lib/design/tokens'
import { cn } from '@/lib/utils'

/**
 * Reusable page hero.
 *
 * x.ai-inspired: bold display headline, generous whitespace, minimal
 * chrome. RevampIT colors preserved (green accent on icon badge when shown).
 *
 * Defaults are deliberately quiet — `display` is opt-in for landing
 * pages that should hit hard, `icon` is optional for pages where a
 * badge would feel like noise (legal pages, transparency, etc.).
 */

interface PageHeroProps {
  theme: ThemeKey
  /** Optional — omit for pages where an icon would be noise. */
  icon?: LucideIcon
  title: string
  subtitle?: string
  /** Use `display` for landing/marketing heroes that should hit hard. */
  size?: 'site' | 'display'
  /** Render content (CTAs, etc.) below the subtitle. */
  children?: React.ReactNode
  className?: string
}

export function PageHero({
  theme,
  icon: Icon,
  title,
  subtitle,
  size = 'site',
  children,
  className = '',
}: PageHeroProps) {
  const iconBadge = DESIGN_TOKENS.iconBadges[theme]
  const isDisplay = size === 'display'

  return (
    <div
      className={cn(
        'bg-surface-base',
        'border-b border-subtle',
        // Generous vertical rhythm for display heroes; standard for site.
        isDisplay ? 'py-20 sm:py-28 lg:py-36' : 'py-16 sm:py-20 lg:py-24',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn('text-center mx-auto', isDisplay ? 'max-w-4xl' : 'max-w-3xl')}>
          {Icon && (
            <div className="flex justify-center mb-6">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBadge.bg)}>
                <Icon className={cn('h-6 w-6', iconBadge.text)} aria-hidden="true" />
              </div>
            </div>
          )}

          <Heading
            level={1}
            variant={isDisplay ? 'display' : 'site'}
            className="text-text-primary"
          >
            {title}
          </Heading>

          {subtitle && (
            <p
              className={cn(
                'mx-auto text-text-tertiary',
                isDisplay
                  ? 'mt-6 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-3xl'
                  : 'mt-5 text-lg sm:text-xl leading-8 max-w-2xl',
              )}
            >
              {subtitle}
            </p>
          )}

          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </div>
  )
}
