import type { MetadataRoute } from 'next'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revamp-it.ch'

  try {
    const result = await query<{ id: string; updated_at: string }>(
      `SELECT id, updated_at FROM ${TABLE_NAMES.LISTINGS}
       WHERE status = 'active'
       ORDER BY updated_at DESC`,
    )

    return result.rows.map(row => ({
      url: `${baseUrl}/marketplace/${row.id}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    logger.error('Failed to generate marketplace sitemap', { error })
    return []
  }
}
