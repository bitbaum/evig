import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ORG, ORG_IMAGES } from '@/config/org'

interface LogoProps {
  className?: string
  href?: string
  /** Reserved for a future wordmark-less variant; the asset already includes text. */
  showText?: boolean
}

/**
 * Brand logo — the SSOT for every logo render (header, footer, menu, auth).
 *
 * MUST be collapse-proof: it lives inside flex rows with `min-w-0`/
 * `justify-between` siblings. `inline-flex shrink-0` makes it size to its
 * content and never shrink to zero; the image carries an intrinsic responsive
 * height (`h-9 sm:h-12 w-auto`) so it renders even when the caller passes no
 * height. Do NOT add `max-w-full` here — inside a `min-w-0` flex item it
 * creates a circular width constraint that collapses the logo to 0px on every
 * screen (regression babd39aec, fixed 2026-07-17).
 */
export function Logo({ className, href = '/' }: LogoProps) {
  return (
    <Link href={href} className={cn('group inline-flex shrink-0 items-center', className)}>
      <Image
        src={ORG_IMAGES.logo}
        alt={ORG.name}
        width={200}
        height={48}
        className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105 sm:h-12"
        priority
      />
    </Link>
  )
}
