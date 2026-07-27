import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { ORG } from '@/config/org'
import { EVIG_MARK } from '@/config/brand'

interface LogoProps {
  className?: string
  href?: string
  /** Render the "evig" wordmark next to the mark. Off = mark only (compact spots). */
  showText?: boolean
}

/**
 * evig brand logo — the SSOT for every logo render (header, footer, menu, auth).
 *
 * Rendered as inline SVG + live text (not a bitmap) so it stays razor-sharp at
 * any size and adapts to light/dark automatically: the "eternal loop" mark is
 * drawn in the brand-green design token (`--color-primary-600`), and the
 * wordmark inherits `currentColor` from its surface — dark on light, light on
 * dark, with zero per-theme assets. The raster favicons/app-icons in
 * `public/` + `src/app/` are generated from the same geometry.
 *
 * Collapse-proof: `inline-flex shrink-0` sizes it to content and never lets a
 * `min-w-0`/`justify-between` flex sibling squeeze it to 0px. The mark carries
 * an intrinsic responsive height (`h-9 sm:h-11`); do NOT add `max-w-full`
 * (creates a circular width constraint that collapses the logo — regression
 * babd39aec, fixed 2026-07-17).
 */
export function Logo({ className, href = '/', showText = true }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={ORG.name}
      className={cn('group inline-flex shrink-0 items-center gap-2', className)}
    >
      <svg
        viewBox={EVIG_MARK.viewBox}
        role="img"
        aria-hidden="true"
        className="h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11"
        fill="none"
        stroke="var(--color-action)"
        strokeWidth={EVIG_MARK.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform={EVIG_MARK.transform}>
          {EVIG_MARK.paths.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
      {showText && (
        <span className="font-sans text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {ORG.name}
        </span>
      )}
    </Link>
  )
}
