import type { MetadataRoute } from 'next'
import { APP_URL } from '@/config/urls'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dashboard/', '/auth/'],
    },
    host: APP_URL,
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
