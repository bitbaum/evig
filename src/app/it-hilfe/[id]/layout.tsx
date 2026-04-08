import { Metadata } from 'next'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

async function getRequestMeta(id: string) {
  try {
    const result = await query<{ title: string; city: string | null }>(
      `SELECT title, city FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} WHERE id = $1`,
      [id]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const request = await getRequestMeta(id)

  if (!request) {
    return { title: 'Anfrage nicht gefunden | RevampIT' }
  }

  const location = request.city ? ` in ${request.city}` : ''
  return {
    title: `${request.title} | IT-Hilfe | RevampIT`,
    description: `IT-Hilfe Anfrage: ${request.title}${location}. Community-basierte Tech-Reparaturhilfe.`,
    openGraph: {
      title: `${request.title} | IT-Hilfe`,
      description: `Reparaturanfrage${location} — Hilf mit oder erfahre mehr.`,
      type: 'article',
    },
  }
}

export default function ITHilfeDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
