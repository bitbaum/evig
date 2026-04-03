import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { listings } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { LISTING_STATUS } from '@/config/marketplace'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL

  try {
    const rows = await db
      .select({ id: listings.id, updatedAt: listings.updatedAt })
      .from(listings)
      .where(eq(listings.status, LISTING_STATUS.ACTIVE))
      .orderBy(desc(listings.updatedAt))

    return rows.map(row => ({
      url: `${baseUrl}/marketplace/${row.id}`,
      lastModified: new Date(row.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    logger.error('Failed to generate marketplace sitemap', { error })
    return []
  }
}
