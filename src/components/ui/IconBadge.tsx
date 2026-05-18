import { cn } from '@/lib/utils'
import { DESIGN_TOKENS, type ThemeKey } from '@/lib/design/tokens'

interface IconBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  theme?: ThemeKey
  size?: 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  className?: string
}

const SIZE = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' }
const ICON_SIZE = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-10 h-10' }
const SHAPE = { circle: 'rounded-full', rounded: 'rounded-xl' }

export function IconBadge({
  icon: Icon,
  theme = 'knowhow',
  size = 'md',
  shape = 'rounded',
  className,
}: IconBadgeProps) {
  const badge = DESIGN_TOKENS.iconBadges[theme]
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        SIZE[size],
        SHAPE[shape],
        badge.bg,
        className
      )}
    >
      <Icon className={cn(ICON_SIZE[size], badge.text)} aria-hidden="true" />
    </div>
  )
}
