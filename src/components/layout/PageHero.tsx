import { LucideIcon } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { DESIGN_TOKENS, ThemeKey } from '@/lib/design/tokens'
import { cn } from '@/lib/utils'

interface PageHeroProps {
  theme: ThemeKey
  icon: LucideIcon
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export function PageHero({
  theme,
  icon: Icon,
  title,
  subtitle,
  children,
  className = '',
}: PageHeroProps) {
  const gradient = DESIGN_TOKENS.gradients[theme]
  const iconBadge = DESIGN_TOKENS.iconBadges[theme]

  return (
    <div
      className={cn(
        // Light mode: page-specific pastel gradient
        `bg-gradient-to-br ${gradient}`,
        // Dark mode: ultra-subtle near-black gradient (xAI style)
        'dark:from-neutral-950 dark:to-neutral-900',
        'py-12 sm:py-16 lg:py-20',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Icon Badge */}
          <div className="flex justify-center mb-6">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm', iconBadge.bg)}>
              <Icon className={cn('h-8 w-8', iconBadge.text)} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <Heading level={1} variant="site" className="tracking-tight text-neutral-900 dark:text-white">
            {title}
          </Heading>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-6 text-lg sm:text-xl leading-8 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}

          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
