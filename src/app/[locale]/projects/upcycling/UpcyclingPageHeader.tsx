import { cn } from '@/lib/utils'

interface UpcyclingPageHeaderProps {
  eyebrow: string
  title: string
  intro: string
  /** Default content width; business plan uses wider layout elsewhere. */
  width?: '5xl' | '7xl'
  className?: string
  /** Optional content below the lede (snapshot chip, deadline, etc.). */
  belowIntro?: React.ReactNode
  /** Optional right-column media (photo, video). Enables two-column layout. */
  media?: React.ReactNode
}

/** Shared page hero for explore + evidence lanes — one visual rhythm across the mini-site. */
export function UpcyclingPageHeader({
  eyebrow,
  title,
  intro,
  width = '5xl',
  className,
  belowIntro,
  media,
}: UpcyclingPageHeaderProps) {
  const copy = (
    <div className="min-w-0">
      <div className="ui-public-eyebrow">{eyebrow}</div>
      <h1 className="ui-public-display-lg mt-3">{title}</h1>
      <p className={cn('ui-public-section-lede mt-4', media ? 'max-w-2xl' : 'max-w-3xl')}>{intro}</p>
      {belowIntro}
    </div>
  )

  return (
    <header className={cn('border-b border-subtle bg-surface-base', className)}>
      <div
        className={cn(
          'mx-auto px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8',
          width === '7xl' ? 'max-w-7xl' : 'max-w-5xl',
        )}
      >
        {media ? (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {copy}
            {media}
          </div>
        ) : (
          copy
        )}
      </div>
    </header>
  )
}
