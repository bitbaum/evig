import Image from 'next/image'
import { cn } from '@/lib/utils'

const BOX_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  xs: 32,
  sm: 36,
  md: 40,
  lg: 48,
  xl: 80,
}

/** Optimizer only accepts whitelisted hosts (next.config remotePatterns);
 *  OAuth avatars (Google/GitHub/…) pass through unoptimized to avoid a runtime throw. */
function isOptimizableHost(src: string): boolean {
  return /\.r2\.dev\//.test(src) || /\.amazonaws\.com\//.test(src)
}

interface AvatarProps {
  /** Image URL (user_profiles.avatar_url / users.image). Absent → initials tile. */
  src?: string | null
  /** Display name (or email) — drives alt text + the initials fallback. */
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  /** Show the subtle border (default off — most chrome avatars have none). */
  bordered?: boolean
  /** Colors for the initials tile. Override for state (active/inactive, super-admin, …). */
  colorClassName?: string
  /** Max initials letters (default 2 → "Georgy Butaev" = "GB"). */
  maxInitials?: number
  /** Layout extras (margins, ring, font-family, …). */
  className?: string
}

const BOX: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-8 w-8',
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
}
const TEXT: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-3xl',
}

function initialsFrom(name: string | null | undefined, max: number): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, max).map((p) => p[0]!.toUpperCase()).join('')
}

/**
 * Avatar — the single source of truth for "image or initials". Renders the
 * uploaded photo when present, else a tokenized initials tile. Replaces the
 * hand-rolled `name.charAt(0)` boxes scattered across the app.
 */
export function Avatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  bordered = false,
  colorClassName = 'bg-action-muted text-action',
  maxInitials = 2,
  className,
}: AvatarProps) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  const border = bordered ? 'border border-subtle' : ''

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? ''}
        width={BOX_PX[size]}
        height={BOX_PX[size]}
        unoptimized={!isOptimizableHost(src)}
        className={cn('shrink-0 object-cover', radius, border, BOX[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold',
        radius,
        border,
        BOX[size],
        TEXT[size],
        colorClassName,
        className,
      )}
      aria-hidden="true"
    >
      {initialsFrom(name, maxInitials)}
    </div>
  )
}
