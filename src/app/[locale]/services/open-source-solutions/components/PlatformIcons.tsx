import { cn } from '@/lib/utils'
import { type Platform, PLATFORM_CONFIG } from '@/config/open-source-registry'

interface PlatformIconsProps {
  platforms: Platform[]
  className?: string
}

export function PlatformIcons({ platforms, className }: PlatformIconsProps) {
  // Deduplicate icons (android and ios both use 📱)
  const seen = new Set<string>()
  const unique = platforms.filter(p => {
    const icon = PLATFORM_CONFIG[p].icon
    if (seen.has(icon)) return false
    seen.add(icon)
    return true
  })

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {unique.map(platform => (
        <span
          key={platform}
          title={PLATFORM_CONFIG[platform].label}
          className="text-sm"
          role="img"
          aria-label={PLATFORM_CONFIG[platform].label}
        >
          {PLATFORM_CONFIG[platform].icon}
        </span>
      ))}
    </div>
  )
}
