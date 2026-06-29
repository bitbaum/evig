import { cn } from '@/lib/utils'

interface AvatarProps {
  /** Avatar image URL (e.g. user_profiles.avatar_url). When absent, the initial is shown. */
  src?: string | null
  /** Display name — drives the alt text and the initial fallback. */
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const BOX: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
}
const TEXT: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

/**
 * Avatar — one source of truth for "image or initial". Renders the uploaded
 * photo when present, else a tokenized initial tile (no ad-hoc placeholders).
 * Square with the card radius to match the fleetcrown public surfaces.
 */
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || 'T'

  if (src) {
    return (
       
      <img
        src={src}
        alt={name ?? ''}
        className={cn('shrink-0 rounded-lg border border-subtle object-cover', BOX[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-subtle bg-action-muted font-mono font-semibold text-action',
        BOX[size],
        TEXT[size],
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  )
}
