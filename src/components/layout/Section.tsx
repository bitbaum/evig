import { cn } from '@/lib/utils'

/**
 * Section — page-section primitive with vertical rhythm SSOT.
 *
 * Pages should never hardcode `py-12 sm:py-16 ...` for sections. Use
 * <Section> so spacing stays consistent and a future tweak is one edit.
 *
 * Densities (x.ai-inspired — generous by default):
 *   compact = py-12 sm:py-16          (admin, dense content)
 *   default = py-16 sm:py-20 lg:py-24 (most public sections)
 *   spacious = py-24 sm:py-32 lg:py-40 (hero-adjacent, feature reveals)
 *
 * Tones (driven by CSS vars — auto-dark):
 *   surface  = page background (default)
 *   tinted   = raised surface (slight contrast between sections)
 *   inverse  = dark band for emphasis (CTAs)
 */

type Density = 'compact' | 'default' | 'spacious'
type Tone = 'surface' | 'tinted' | 'inverse'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  density?: Density
  tone?: Tone
  /** Full-bleed background, content stays in max-w-7xl container. Default true. */
  contained?: boolean
}

const densityClass: Record<Density, string> = {
  compact:  'py-12 sm:py-16',
  default:  'py-16 sm:py-20 lg:py-24',
  spacious: 'py-24 sm:py-32 lg:py-40',
}

const toneClass: Record<Tone, string> = {
  surface: 'bg-surface-base',
  tinted:  'bg-surface-raised',
  inverse: 'bg-surface-overlay text-white',
}

export function Section({
  density = 'default',
  tone = 'surface',
  contained = true,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      className={cn(densityClass[density], toneClass[tone], className)}
      {...rest}
    >
      {contained ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}
