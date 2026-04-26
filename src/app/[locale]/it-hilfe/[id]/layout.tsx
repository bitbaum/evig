import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger'

async function getRequestMeta(id: string) {
  try {
    const result = await query<{ title: string; city: string | null }>(
      `SELECT title, city FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} WHERE id = $1`,
      [id]
    )
    return result.rows[0] ?? null
  } catch (err) {
    logger.warn('Failed to load IT-Hilfe request meta', { error: err, id })
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'itHelp.meta' })
  const request = await getRequestMeta(id)

  if (!request) {
    return { title: t('notFoundTitle', { orgName: ORG.name }) }
  }

  const location = request.city ? t('inCity', { city: request.city }) : ''
  return {
    title: t('detailTitle', { title: request.title, orgName: ORG.name }),
    description: t('detailDescription', { title: request.title, location }),
    openGraph: {
      title: t('detailTitle', { title: request.title, orgName: ORG.name }),
      description: t('detailOgDescription', { location }),
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
