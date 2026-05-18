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
  const iconBadge = DESIGN_TOKENS.iconBadges[theme]

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-950',
        'border-b border-neutral-100 dark:border-white/[0.06]',
        'py-16 sm:py-20 lg:py-24',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Icon Badge */}
          <div className="flex justify-center mb-6">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBadge.bg)}>
              <Icon className={cn('h-6 w-6', iconBadge.text)} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <Heading level={1} variant="site" className="tracking-tight text-neutral-900 dark:text-white">
            {title}
          </Heading>

          {/* Accent line */}
          <div className="flex justify-center mt-4">
            <div className="h-0.5 w-10 bg-primary-500 dark:bg-primary-400 rounded-full" />
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-5 text-lg sm:text-xl leading-8 text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
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
