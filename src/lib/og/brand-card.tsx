import { ORG } from '@/config/org'
import { OG_IMAGE_COLORS } from '@/config/ui-colors'
import { EVIG_MARK } from '@/config/brand'

/**
 * evig Open Graph share card — the SINGLE source for every og:image
 * (`/opengraph-image` and `/[locale]/opengraph-image` both render this).
 *
 * All copy comes from the `org.ts` SSOT (name/motto/description) so the social
 * preview can never drift from the brand. The "eternal loop" mark is drawn
 * inline (same geometry as the favicon/logo) in the brand-green accent.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_ALT = `${ORG.name} — ${ORG.motto}`

/**
 * The mark as a self-contained SVG data URI. Rendered via <img> (not inline
 * <svg>) so next/og's resvg rasterizes it — reliable stroke support, unlike
 * Satori's partial inline-SVG handling. Green comes from the OG accent token.
 */
const MARK_DATA_URI = `data:image/svg+xml;base64,${btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EVIG_MARK.viewBox}" fill="none"><path d="${EVIG_MARK.ringPath}" stroke="${OG_IMAGE_COLORS.accent}" stroke-width="${EVIG_MARK.strokeWidth}"/><circle cx="${EVIG_MARK.node.cx}" cy="${EVIG_MARK.node.cy}" r="${EVIG_MARK.node.r}" fill="${OG_IMAGE_COLORS.accent}"/></svg>`
)}`

export function BrandOgCard() {
  return (
    <div
      style={{
        background: OG_IMAGE_COLORS.backgroundGradient,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '72px',
      }}
    >
      {/* Plain <img>: this tree is rendered by next/og (Satori), not the DOM — next/image doesn't apply. */}
      <img src={MARK_DATA_URI} width={132} height={132} alt="" />
      <div
        style={{
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: '-4px',
          color: OG_IMAGE_COLORS.heading,
          marginTop: 12,
          lineHeight: 1,
        }}
      >
        {ORG.name}
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 600,
          color: OG_IMAGE_COLORS.accent,
          marginTop: 28,
          textAlign: 'center',
        }}
      >
        {ORG.motto}
      </div>
      <div
        style={{
          fontSize: 26,
          color: OG_IMAGE_COLORS.body,
          marginTop: 24,
          textAlign: 'center',
          maxWidth: 860,
          lineHeight: 1.5,
        }}
      >
        {ORG.description}
      </div>
    </div>
  )
}
