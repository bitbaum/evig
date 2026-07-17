/**
 * MonitorLampPlaceholder — generative SVG placeholder for the Monitor-Upcycling
 * mini-site, used until real product photography is available.
 *
 * Renders a stylised monitor-as-lamp: a flat-screen silhouette with a soft
 * radial glow at the panel area, mounted on a thin stand, on top of a
 * gradient background that varies by `variant`. The whole thing inherits
 * the page's color tokens so it works in both light and dark mode without
 * any media-query overrides.
 *
 * Variants encode the spectrum the project lives on:
 *   functional — cool neutral grey, office/utility feel
 *   warm       — warm amber, home/café decor
 *   cool       — cool teal, gallery/installation
 *   art        — saturated magenta/violet, art object
 *
 * Each instance is stable for a given (variant, seed) pair: the dot
 * pattern offsets and glow radius are derived from `seed` so a grid of
 * placeholders looks varied rather than copy-pasted.
 */

type Variant = 'functional' | 'warm' | 'cool' | 'art'
import { MONITOR_LAMP_PLACEHOLDER_COLORS as COLORS } from '@/config/ui-colors'

interface MonitorLampPlaceholderProps {
  variant?: Variant
  /** Used to vary glow position/intensity across a grid. Same seed → same image. */
  seed?: number
  /** Caption rendered beneath the monitor — short context label. */
  caption?: string
  className?: string
}

const PALETTE: Record<Variant, { from: string; to: string; glow: string }> = COLORS

export function MonitorLampPlaceholder({
  variant = 'functional',
  seed = 0,
  caption,
  className,
}: MonitorLampPlaceholderProps) {
  const p = PALETTE[variant]
  // Deterministic pseudo-random per seed — keeps every card stable across SSR.
  const jitter = ((seed * 9301 + 49297) % 233280) / 233280
  const glowX = 50 + (jitter - 0.5) * 8
  const glowR = 18 + jitter * 6

  const gradId = `lamp-bg-${variant}-${seed}`
  const glowId = `lamp-glow-${variant}-${seed}`
  const dotId = `lamp-dot-${variant}-${seed}`

  return (
    <figure className={className}>
      <svg
        viewBox="0 0 400 300"
        className="block h-full w-full"
        role="img"
        aria-label={caption ?? 'Monitor-Leuchte Platzhalter'}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.95" />
            <stop offset="40%" stopColor={p.glow} stopOpacity="0.55" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
          <pattern
            id={dotId}
            x="0"
            y="0"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.5" fill={p.glow} fillOpacity="0.08" />
          </pattern>
        </defs>

        <rect width="400" height="300" fill={`url(#${gradId})`} />
        <rect width="400" height="300" fill={`url(#${dotId})`} />

        {/* Ambient glow behind monitor — sells the "this is a light" idea */}
        <circle
          cx={`${glowX}%`}
          cy="45%"
          r={`${glowR}%`}
          fill={`url(#${glowId})`}
        />

        {/* Monitor bezel */}
        <g transform="translate(110, 70)">
          <rect width="180" height="120" rx="4" fill={COLORS.bezel} />
          {/* Screen (the light surface) */}
          <rect x="6" y="6" width="168" height="108" rx="2" fill={p.glow} fillOpacity="0.85" />
          <rect x="6" y="6" width="168" height="108" rx="2" fill={`url(#${glowId})`} />
          {/* Subtle bezel highlight */}
          <rect width="180" height="120" rx="4" fill="none" stroke={COLORS.highlight} strokeOpacity="0.08" />
        </g>

        {/* Stand */}
        <g transform="translate(180, 190)">
          <rect width="40" height="10" rx="1" fill={COLORS.stand} />
          <rect x="-30" y="10" width="100" height="6" rx="1" fill={COLORS.stand} />
        </g>

        {/* Floor line — anchors the composition */}
        <line
          x1="0"
          y1="220"
          x2="400"
          y2="220"
          stroke={COLORS.highlight}
          strokeOpacity="0.06"
        />
      </svg>

      {caption && (
        <figcaption className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export type { Variant as MonitorLampPlaceholderVariant }
