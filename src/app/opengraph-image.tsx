import { ImageResponse } from 'next/og'
import { ORG } from '@/config/org'
import { OG_IMAGE_COLORS } from '@/config/ui-colors'

export const runtime = 'edge'
export const alt = `${ORG.name} — ${ORG.motto}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: OG_IMAGE_COLORS.backgroundGradient,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 24, display: 'flex' }}>
          ♻️
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: OG_IMAGE_COLORS.heading, textAlign: 'center', lineHeight: 1.1 }}>
          Alte Hardware.
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: OG_IMAGE_COLORS.accent, textAlign: 'center', lineHeight: 1.1, marginTop: 8 }}>
          Neues Leben.
        </div>
        <div style={{ fontSize: 26, color: OG_IMAGE_COLORS.body, marginTop: 36, textAlign: 'center', maxWidth: 800, lineHeight: 1.5 }}>
          Computer reparieren · Gebrauchte Hardware · Linux & Open Source
        </div>
        <div style={{ fontSize: 22, color: OG_IMAGE_COLORS.meta, marginTop: 44, letterSpacing: 1 }}>
          {ORG.emailDomain}
        </div>
      </div>
    ),
    { ...size }
  )
}
