import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Revamp-IT — Alte Hardware. Neues Leben.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
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
        <div style={{ fontSize: 72, fontWeight: 800, color: '#111827', textAlign: 'center', lineHeight: 1.1 }}>
          Alte Hardware.
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#16a34a', textAlign: 'center', lineHeight: 1.1, marginTop: 8 }}>
          Neues Leben.
        </div>
        <div style={{ fontSize: 26, color: '#4b5563', marginTop: 36, textAlign: 'center', maxWidth: 800, lineHeight: 1.5 }}>
          Computer reparieren · Gebrauchte Hardware · Linux &amp; Open Source
        </div>
        <div style={{ fontSize: 22, color: '#9ca3af', marginTop: 44, letterSpacing: 1 }}>
          revamp-it.ch
        </div>
      </div>
    ),
    { ...size }
  )
}
